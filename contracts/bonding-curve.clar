;; BondingCurve Contract for Stacks
;; Comprehensive bonding curve implementation with multiple curve types and liquidity management

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant CURVE-LINEAR u0)
(define-constant CURVE-EXPONENTIAL u1)
(define-constant CURVE-LOGARITHMIC u2)
(define-constant CURVE-SIGMOID u3)

;; Error codes
(define-constant ERR-UNAUTHORIZED (err u2000))
(define-constant ERR-TOKEN-ALREADY-EXISTS (err u2001))
(define-constant ERR-TOKEN-NOT-FOUND (err u2002))
(define-constant ERR-INSUFFICIENT-PAYMENT (err u2003))
(define-constant ERR-INSUFFICIENT-SUPPLY (err u2004))
(define-constant ERR-INSUFFICIENT-LIQUIDITY (err u2005))
(define-constant ERR-INVALID-AMOUNT (err u2006))
(define-constant ERR-PAUSED (err u2007))
(define-constant ERR-SLIPPAGE-EXCEEDED (err u2008))
(define-constant ERR-INVALID-CURVE-TYPE (err u2009))
(define-constant ERR-GRADUATION-THRESHOLD-NOT-MET (err u2010))
(define-constant ERR-ALREADY-GRADUATED (err u2011))

;; Data structures
(define-map curve-info
  { symbol: (string-ascii 32) }
  {
    supply: uint,
    base-price: uint,
    reserve-balance: uint,
    curve-type: uint,
    slope: uint,
    creator: principal,
    created-at: uint,
    graduated: bool,
    fee-percentage: uint,
    accumulated-fees: uint
  }
)

;; Trading history
(define-map trade-history
  { symbol: (string-ascii 32), trade-id: uint }
  {
    trader: principal,
    amount: uint,
    price: uint,
    is-buy: bool,
    timestamp: uint,
    block: uint
  }
)

(define-map trade-counts (string-ascii 32) uint)

;; User positions
(define-map user-positions
  { user: principal, symbol: (string-ascii 32) }
  {
    amount: uint,
    total-spent: uint,
    average-price: uint,
    last-trade: uint
  }
)

;; Curve parameters
(define-map curve-parameters
  { symbol: (string-ascii 32) }
  {
    graduation-threshold: uint,
    max-supply: uint,
    min-price: uint,
    max-price: uint
  }
)

;; Global settings
(define-data-var contract-paused bool false)
(define-data-var protocol-fee-percentage uint u30) ;; 0.3% = 30 basis points
(define-data-var protocol-fee-recipient principal CONTRACT-OWNER)
(define-data-var graduation-enabled bool true)

;; Admin management
(define-map admins principal bool)
(map-set admins CONTRACT-OWNER true)

;; Launch a new token with bonding curve
(define-public (launch-token
  (symbol (string-ascii 32))
  (base-price uint)
  (curve-type uint)
  (slope uint)
  (graduation-threshold uint)
  (max-supply uint))
  (let ((existing (map-get? curve-info { symbol: symbol })))
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (is-none existing) ERR-TOKEN-ALREADY-EXISTS)
    (asserts! (<= curve-type CURVE-SIGMOID) ERR-INVALID-CURVE-TYPE)
    (asserts! (> base-price u0) ERR-INVALID-AMOUNT)

    ;; Initialize curve info
    (map-set curve-info
      { symbol: symbol }
      {
        supply: u0,
        base-price: base-price,
        reserve-balance: u0,
        curve-type: curve-type,
        slope: slope,
        creator: tx-sender,
        created-at: block-height,
        graduated: false,
        fee-percentage: (var-get protocol-fee-percentage),
        accumulated-fees: u0
      }
    )

    ;; Set curve parameters
    (map-set curve-parameters
      { symbol: symbol }
      {
        graduation-threshold: graduation-threshold,
        max-supply: max-supply,
        min-price: base-price,
        max-price: (* base-price u1000)
      }
    )

    ;; Initialize trade count
    (map-set trade-counts symbol u0)

    (print {
      event: "token-launched",
      symbol: symbol,
      creator: tx-sender,
      base-price: base-price,
      curve-type: curve-type,
      slope: slope,
      graduation-threshold: graduation-threshold,
      max-supply: max-supply,
      block: block-height
    })

    (ok true)
  )
)

;; Buy tokens using bonding curve
(define-public (buy-token
  (symbol (string-ascii 32))
  (amount uint)
  (max-slippage uint))
  (let (
    (curve (unwrap! (map-get? curve-info { symbol: symbol }) ERR-TOKEN-NOT-FOUND))
    (current-supply (get supply curve))
    (base-price (get base-price curve))
    (curve-type (get curve-type curve))
    (slope (get slope curve))
    (reserve (get reserve-balance curve))
    (required-payment (calculate-buy-cost symbol current-supply amount curve-type base-price slope))
    (fee (calculate-fee required-payment (get fee-percentage curve)))
    (total-cost (+ required-payment fee))
    (params (unwrap! (map-get? curve-parameters { symbol: symbol }) ERR-TOKEN-NOT-FOUND))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (not (get graduated curve)) ERR-ALREADY-GRADUATED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (<= (+ current-supply amount) (get max-supply params)) ERR-INSUFFICIENT-SUPPLY)

    ;; Check slippage
    (asserts! (<= total-cost (+ required-payment (/ (* required-payment max-slippage) u10000))) ERR-SLIPPAGE-EXCEEDED)

    ;; Transfer STX from buyer to contract
    (try! (stx-transfer? total-cost tx-sender (as-contract tx-sender)))

    ;; Update curve info
    (map-set curve-info
      { symbol: symbol }
      (merge curve {
        supply: (+ current-supply amount),
        reserve-balance: (+ reserve required-payment),
        accumulated-fees: (+ (get accumulated-fees curve) fee)
      })
    )

    ;; Update user position
    (update-user-position tx-sender symbol amount total-cost true)

    ;; Record trade
    (record-trade symbol tx-sender amount total-cost true)

    (print {
      event: "token-bought",
      symbol: symbol,
      buyer: tx-sender,
      amount: amount,
      cost: total-cost,
      fee: fee,
      new-supply: (+ current-supply amount),
      block: block-height
    })

    (ok { amount: amount, cost: total-cost, fee: fee })
  )
)

;; Sell tokens and get refund
(define-public (sell-token
  (symbol (string-ascii 32))
  (amount uint)
  (min-received uint))
  (let (
    (curve (unwrap! (map-get? curve-info { symbol: symbol }) ERR-TOKEN-NOT-FOUND))
    (current-supply (get supply curve))
    (base-price (get base-price curve))
    (curve-type (get curve-type curve))
    (slope (get slope curve))
    (reserve (get reserve-balance curve))
    (position (unwrap! (map-get? user-positions { user: tx-sender, symbol: symbol }) ERR-INSUFFICIENT-SUPPLY))
    (refund-amount (calculate-sell-return symbol current-supply amount curve-type base-price slope))
    (fee (calculate-fee refund-amount (get fee-percentage curve)))
    (net-refund (- refund-amount fee))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (not (get graduated curve)) ERR-ALREADY-GRADUATED)
    (asserts! (>= (get amount position) amount) ERR-INSUFFICIENT-SUPPLY)
    (asserts! (>= reserve refund-amount) ERR-INSUFFICIENT-LIQUIDITY)
    (asserts! (>= net-refund min-received) ERR-SLIPPAGE-EXCEEDED)

    ;; Update curve info
    (map-set curve-info
      { symbol: symbol }
      (merge curve {
        supply: (- current-supply amount),
        reserve-balance: (- reserve refund-amount),
        accumulated-fees: (+ (get accumulated-fees curve) fee)
      })
    )

    ;; Update user position
    (update-user-position tx-sender symbol amount net-refund false)

    ;; Record trade
    (record-trade symbol tx-sender amount net-refund false)

    ;; Transfer STX from contract to seller
    (try! (as-contract (stx-transfer? net-refund tx-sender tx-sender)))

    (print {
      event: "token-sold",
      symbol: symbol,
      seller: tx-sender,
      amount: amount,
      received: net-refund,
      fee: fee,
      new-supply: (- current-supply amount),
      block: block-height
    })

    (ok { amount: amount, received: net-refund, fee: fee })
  )
)

;; Graduate token to external DEX
;; This prepares token for DEX listing when threshold is met
(define-public (graduate-token (symbol (string-ascii 32)))
  (let (
    (curve (unwrap! (map-get? curve-info { symbol: symbol }) ERR-TOKEN-NOT-FOUND))
    (params (unwrap! (map-get? curve-parameters { symbol: symbol }) ERR-TOKEN-NOT-FOUND))
    (reserve (get reserve-balance curve))
    (total-supply (get supply curve))
  )
    (asserts! (var-get graduation-enabled) ERR-UNAUTHORIZED)
    (asserts! (not (get graduated curve)) ERR-ALREADY-GRADUATED)
    (asserts! (>= reserve (get graduation-threshold params)) ERR-GRADUATION-THRESHOLD-NOT-MET)

    ;; Mark as graduated
    (map-set curve-info
      { symbol: symbol }
      (merge curve { graduated: true })
    )

    (print {
      event: "token-graduated",
      symbol: symbol,
      reserve-balance: reserve,
      supply: total-supply,
      graduation-liquidity: reserve,
      ready-for-dex: true,
      block: block-height
    })

    (ok true)
  )
)

;; Calculate buy cost based on curve type
(define-private (calculate-buy-cost
  (symbol (string-ascii 32))
  (current-supply uint)
  (amount uint)
  (curve-type uint)
  (base-price uint)
  (slope uint))
  (if (is-eq curve-type CURVE-LINEAR)
    ;; Linear: price = base + (supply * slope)
    (* amount (+ base-price (* current-supply slope)))
    (if (is-eq curve-type CURVE-EXPONENTIAL)
      ;; Exponential: simplified for gas efficiency
      (* amount (+ base-price (* (pow-uint current-supply u2) slope)))
      (if (is-eq curve-type CURVE-LOGARITHMIC)
        ;; Logarithmic: simplified
        (* amount (+ base-price (/ (* (log2 (+ current-supply u1)) slope) u100)))
        ;; Sigmoid: simplified
        (* amount (+ base-price (* current-supply slope)))
      )
    )
  )
)

;; Calculate sell return based on curve type
(define-private (calculate-sell-return
  (symbol (string-ascii 32))
  (current-supply uint)
  (amount uint)
  (curve-type uint)
  (base-price uint)
  (slope uint))
  (let ((new-supply (- current-supply amount)))
    (if (is-eq curve-type CURVE-LINEAR)
      (* amount (+ base-price (* new-supply slope)))
      (if (is-eq curve-type CURVE-EXPONENTIAL)
        (* amount (+ base-price (* (pow-uint new-supply u2) slope)))
        (if (is-eq curve-type CURVE-LOGARITHMIC)
          (* amount (+ base-price (/ (* (log2 (+ new-supply u1)) slope) u100)))
          (* amount (+ base-price (* new-supply slope)))
        )
      )
    )
  )
)

;; Helper: Power function (simplified, max exponent = 3)
(define-private (pow-uint (base uint) (exponent uint))
  (if (is-eq exponent u0)
    u1
    (if (is-eq exponent u1)
      base
      (if (is-eq exponent u2)
        (* base base)
        (* base (* base base)) ;; exponent = 3
      )
    )
  )
)

;; Helper: Log2 approximation (non-recursive)
(define-private (log2 (n uint))
  (if (<= n u1) u0
  (if (<= n u3) u1
  (if (<= n u7) u2
  (if (<= n u15) u3
  (if (<= n u31) u4
  (if (<= n u63) u5
  (if (<= n u127) u6
  (if (<= n u255) u7
  (if (<= n u511) u8
  (if (<= n u1023) u9
  u10
  ))))))))))
)

;; Calculate fee
(define-private (calculate-fee (amount uint) (fee-percentage uint))
  (/ (* amount fee-percentage) u10000)
)

;; Update user position
(define-private (update-user-position
  (user principal)
  (symbol (string-ascii 32))
  (amount uint)
  (cost uint)
  (is-buy bool))
  (let ((position (default-to
    { amount: u0, total-spent: u0, average-price: u0, last-trade: u0 }
    (map-get? user-positions { user: user, symbol: symbol }))))
    (if is-buy
      (let (
        (new-amount (+ (get amount position) amount))
        (new-spent (+ (get total-spent position) cost))
      )
        (map-set user-positions
          { user: user, symbol: symbol }
          {
            amount: new-amount,
            total-spent: new-spent,
            average-price: (/ new-spent new-amount),
            last-trade: block-height
          }
        )
      )
      (let (
        (new-amount (- (get amount position) amount))
        (spent-ratio (/ (* (get total-spent position) amount) (get amount position)))
        (new-spent (- (get total-spent position) spent-ratio))
      )
        (map-set user-positions
          { user: user, symbol: symbol }
          {
            amount: new-amount,
            total-spent: new-spent,
            average-price: (if (> new-amount u0) (/ new-spent new-amount) u0),
            last-trade: block-height
          }
        )
      )
    )
  )
)

;; Record trade history
(define-private (record-trade
  (symbol (string-ascii 32))
  (trader principal)
  (amount uint)
  (price uint)
  (is-buy bool))
  (let ((trade-count (default-to u0 (map-get? trade-counts symbol))))
    (map-set trade-history
      { symbol: symbol, trade-id: trade-count }
      {
        trader: trader,
        amount: amount,
        price: price,
        is-buy: is-buy,
        timestamp: block-height,
        block: block-height
      }
    )
    (map-set trade-counts symbol (+ trade-count u1))
  )
)

;; Read-only functions

(define-read-only (token-exists (symbol (string-ascii 32)))
  (is-some (map-get? curve-info { symbol: symbol }))
)

(define-read-only (get-curve-info (symbol (string-ascii 32)))
  (map-get? curve-info { symbol: symbol })
)

(define-read-only (get-token-supply (symbol (string-ascii 32)))
  (match (map-get? curve-info { symbol: symbol })
    curve (ok (get supply curve))
    ERR-TOKEN-NOT-FOUND
  )
)

(define-read-only (get-token-price (symbol (string-ascii 32)))
  (match (map-get? curve-info { symbol: symbol })
    curve (ok (get base-price curve))
    ERR-TOKEN-NOT-FOUND
  )
)

(define-read-only (get-reserve-balance (symbol (string-ascii 32)))
  (match (map-get? curve-info { symbol: symbol })
    curve (ok (get reserve-balance curve))
    ERR-TOKEN-NOT-FOUND
  )
)

(define-read-only (calculate-buy-price (symbol (string-ascii 32)) (amount uint))
  (match (map-get? curve-info { symbol: symbol })
    curve
      (let (
        (current-supply (get supply curve))
        (base-price (get base-price curve))
        (curve-type (get curve-type curve))
        (slope (get slope curve))
        (cost (calculate-buy-cost symbol current-supply amount curve-type base-price slope))
        (fee (calculate-fee cost (get fee-percentage curve)))
      )
        (ok { cost: cost, fee: fee, total: (+ cost fee) })
      )
    ERR-TOKEN-NOT-FOUND
  )
)

(define-read-only (calculate-sell-price (symbol (string-ascii 32)) (amount uint))
  (match (map-get? curve-info { symbol: symbol })
    curve
      (let (
        (current-supply (get supply curve))
        (base-price (get base-price curve))
        (curve-type (get curve-type curve))
        (slope (get slope curve))
        (return (calculate-sell-return symbol current-supply amount curve-type base-price slope))
        (fee (calculate-fee return (get fee-percentage curve)))
      )
        (ok { return: return, fee: fee, net: (- return fee) })
      )
    ERR-TOKEN-NOT-FOUND
  )
)

(define-read-only (get-user-position (user principal) (symbol (string-ascii 32)))
  (map-get? user-positions { user: user, symbol: symbol })
)

(define-read-only (get-trade-history (symbol (string-ascii 32)) (trade-id uint))
  (map-get? trade-history { symbol: symbol, trade-id: trade-id })
)

(define-read-only (get-trade-count (symbol (string-ascii 32)))
  (default-to u0 (map-get? trade-counts symbol))
)

(define-read-only (get-curve-parameters (symbol (string-ascii 32)))
  (map-get? curve-parameters { symbol: symbol })
)

(define-read-only (is-graduated (symbol (string-ascii 32)))
  (match (map-get? curve-info { symbol: symbol })
    curve (ok (get graduated curve))
    ERR-TOKEN-NOT-FOUND
  )
)

;; Admin functions

(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set contract-paused paused)
    (print { event: "pause-state-changed", paused: paused })
    (ok true)
  )
)

(define-public (set-protocol-fee (fee-percentage uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (<= fee-percentage u1000) ERR-INVALID-AMOUNT) ;; Max 10%
    (var-set protocol-fee-percentage fee-percentage)
    (print { event: "protocol-fee-updated", fee-percentage: fee-percentage })
    (ok true)
  )
)

(define-public (set-fee-recipient (recipient principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set protocol-fee-recipient recipient)
    (print { event: "fee-recipient-updated", recipient: recipient })
    (ok true)
  )
)

(define-public (set-graduation-enabled (enabled bool))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set graduation-enabled enabled)
    (print { event: "graduation-enabled-updated", enabled: enabled })
    (ok true)
  )
)

(define-public (add-admin (admin principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set admins admin true)
    (print { event: "admin-added", admin: admin })
    (ok true)
  )
)

(define-public (remove-admin (admin principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (is-eq admin CONTRACT-OWNER)) ERR-UNAUTHORIZED)
    (map-set admins admin false)
    (print { event: "admin-removed", admin: admin })
    (ok true)
  )
)

(define-public (withdraw-fees (symbol (string-ascii 32)))
  (let (
    (curve (unwrap! (map-get? curve-info { symbol: symbol }) ERR-TOKEN-NOT-FOUND))
    (fees (get accumulated-fees curve))
  )
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (> fees u0) ERR-INVALID-AMOUNT)

    (map-set curve-info
      { symbol: symbol }
      (merge curve { accumulated-fees: u0 })
    )

    (print {
      event: "fees-withdrawn",
      symbol: symbol,
      amount: fees,
      recipient: (var-get protocol-fee-recipient)
    })

    (ok fees)
  )
)

(define-read-only (is-admin (address principal))
  (default-to false (map-get? admins address))
)

(define-read-only (is-paused)
  (var-get contract-paused))

(define-read-only (get-protocol-fee)
  (var-get protocol-fee-percentage))

(define-read-only (get-fee-recipient)
  (var-get protocol-fee-recipient))
