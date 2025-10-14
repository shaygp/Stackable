;; Marketplace Contract for Stacks
;; Decentralized marketplace for trading tokens with orderbook and price discovery

;; Order types
(define-constant ORDER-TYPE-MARKET u0)
(define-constant ORDER-TYPE-LIMIT u1)
(define-constant ORDER-SIDE-BUY u0)
(define-constant ORDER-SIDE-SELL u1)
(define-constant ORDER-STATUS-OPEN u0)
(define-constant ORDER-STATUS-FILLED u1)
(define-constant ORDER-STATUS-CANCELLED u2)
(define-constant ORDER-STATUS-PARTIAL u3)

;; Error codes
(define-constant ERR-UNAUTHORIZED (err u4000))
(define-constant ERR-TOKEN-NOT-LISTED (err u4001))
(define-constant ERR-TOKEN-ALREADY-LISTED (err u4002))
(define-constant ERR-INVALID-PRICE (err u4003))
(define-constant ERR-INVALID-AMOUNT (err u4004))
(define-constant ERR-ORDER-NOT-FOUND (err u4005))
(define-constant ERR-INSUFFICIENT-BALANCE (err u4006))
(define-constant ERR-ORDER-ALREADY-FILLED (err u4007))
(define-constant ERR-PAUSED (err u4008))
(define-constant ERR-INVALID-ORDER-TYPE (err u4009))
(define-constant ERR-NOT-ORDER-OWNER (err u4010))
(define-constant ERR-NOT-INITIALIZED (err u4011))

;; Data structures

;; Token listings
(define-map token-listings
  { symbol: (string-ascii 32) }
  {
    name: (string-utf8 256),
    creator: principal,
    listed-at: uint,
    verified: bool,
    trading-volume-24h: uint,
    price-high-24h: uint,
    price-low-24h: uint,
    last-price: uint,
    total-trades: uint,
    active: bool,
    metadata-uri: (optional (string-utf8 256))
  }
)

;; Orderbook
(define-map orders
  { order-id: uint }
  {
    trader: principal,
    symbol: (string-ascii 32),
    order-type: uint,
    side: uint,
    price: uint,
    amount: uint,
    filled-amount: uint,
    status: uint,
    created-at: uint,
    expires-at: (optional uint)
  }
)

(define-data-var next-order-id uint u0)

;; Order matching engine state
(define-map order-fills
  { order-id: uint, fill-id: uint }
  {
    fill-amount: uint,
    fill-price: uint,
    counterparty: principal,
    filled-at: uint
  }
)

(define-map order-fill-counts uint uint)

;; Trading pairs statistics
(define-map trading-stats
  { symbol: (string-ascii 32), period: uint }
  {
    volume: uint,
    high: uint,
    low: uint,
    open: uint,
    close: uint,
    trades: uint
  }
)

;; User trading history
(define-map user-trades
  { user: principal, trade-id: uint }
  {
    symbol: (string-ascii 32),
    side: uint,
    amount: uint,
    price: uint,
    timestamp: uint
  }
)

(define-map user-trade-counts principal uint)

;; Featured tokens
(define-map featured-tokens
  { symbol: (string-ascii 32) }
  { featured: bool, featured-at: uint }
)

;; Trading fees
(define-data-var maker-fee-bps uint u10)
(define-data-var taker-fee-bps uint u30)
(define-data-var fee-recipient principal (as-contract tx-sender))
(define-data-var accumulated-fees uint u0)
(define-data-var contract-owner (optional principal) none)

;; Global settings
(define-data-var contract-paused bool false)
(define-data-var minimum-order-size uint u1)
(define-data-var maximum-order-size uint u1000000000000)

;; Admin management
(define-map admins principal bool)
(define-map verifiers principal bool)

;; Initialize the contract
(define-public (initialize (owner principal))
  (begin
    (asserts! (is-none (var-get contract-owner)) ERR-UNAUTHORIZED)
    (var-set contract-owner (some owner))
    (var-set fee-recipient owner)
    (map-set admins owner true)
    (map-set verifiers owner true)
    (ok true)
  )
)

;; Token Listing Functions

;; List a token on the marketplace
(define-public (list-token
  (symbol (string-ascii 32))
  (name (string-utf8 256))
  (metadata-uri (optional (string-utf8 256))))
  (let ((existing (map-get? token-listings { symbol: symbol })))
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (is-none existing) ERR-TOKEN-ALREADY-LISTED)

    (map-set token-listings
      { symbol: symbol }
      {
        name: name,
        creator: tx-sender,
        listed-at: block-height,
        verified: false,
        trading-volume-24h: u0,
        price-high-24h: u0,
        price-low-24h: u0,
        last-price: u0,
        total-trades: u0,
        active: true,
        metadata-uri: metadata-uri
      }
    )

    (print {
      event: "token-listed",
      symbol: symbol,
      creator: tx-sender,
      name: name,
      block: block-height
    })

    (ok true)
  )
)

;; Delist a token (admin or creator only)
(define-public (delist-token (symbol (string-ascii 32)))
  (let ((listing (unwrap! (map-get? token-listings { symbol: symbol }) ERR-TOKEN-NOT-LISTED)))
    (asserts! (or (is-admin tx-sender) (is-eq tx-sender (get creator listing))) ERR-UNAUTHORIZED)

    (map-set token-listings
      { symbol: symbol }
      (merge listing { active: false })
    )

    (print {
      event: "token-delisted",
      symbol: symbol,
      delisted-by: tx-sender
    })

    (ok true)
  )
)

;; Verify a token (verifiers only)
(define-public (verify-token (symbol (string-ascii 32)))
  (let ((listing (unwrap! (map-get? token-listings { symbol: symbol }) ERR-TOKEN-NOT-LISTED)))
    (asserts! (is-verifier tx-sender) ERR-UNAUTHORIZED)

    (map-set token-listings
      { symbol: symbol }
      (merge listing { verified: true })
    )

    (print {
      event: "token-verified",
      symbol: symbol,
      verified-by: tx-sender
    })

    (ok true)
  )
)

;; Order Functions

;; Place a limit order
(define-public (place-limit-order
  (symbol (string-ascii 32))
  (side uint)
  (price uint)
  (amount uint)
  (expires-at (optional uint)))
  (let (
    (listing (unwrap! (map-get? token-listings { symbol: symbol }) ERR-TOKEN-NOT-LISTED))
    (order-id (var-get next-order-id))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (get active listing) ERR-TOKEN-NOT-LISTED)
    (asserts! (> price u0) ERR-INVALID-PRICE)
    (asserts! (>= amount (var-get minimum-order-size)) ERR-INVALID-AMOUNT)
    (asserts! (<= amount (var-get maximum-order-size)) ERR-INVALID-AMOUNT)
    (asserts! (<= side ORDER-SIDE-SELL) ERR-INVALID-ORDER-TYPE)

    (map-set orders
      { order-id: order-id }
      {
        trader: tx-sender,
        symbol: symbol,
        order-type: ORDER-TYPE-LIMIT,
        side: side,
        price: price,
        amount: amount,
        filled-amount: u0,
        status: ORDER-STATUS-OPEN,
        created-at: block-height,
        expires-at: expires-at
      }
    )

    (var-set next-order-id (+ order-id u1))
    (map-set order-fill-counts order-id u0)

    (print {
      event: "order-placed",
      order-id: order-id,
      trader: tx-sender,
      symbol: symbol,
      side: side,
      order-type: ORDER-TYPE-LIMIT,
      price: price,
      amount: amount,
      block: block-height
    })

    (ok order-id)
  )
)

;; Place a market order
(define-public (place-market-order
  (symbol (string-ascii 32))
  (side uint)
  (amount uint))
  (let (
    (listing (unwrap! (map-get? token-listings { symbol: symbol }) ERR-TOKEN-NOT-LISTED))
    (order-id (var-get next-order-id))
    (market-price (get last-price listing))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (get active listing) ERR-TOKEN-NOT-LISTED)
    (asserts! (> market-price u0) ERR-INVALID-PRICE)
    (asserts! (>= amount (var-get minimum-order-size)) ERR-INVALID-AMOUNT)
    (asserts! (<= amount (var-get maximum-order-size)) ERR-INVALID-AMOUNT)

    (map-set orders
      { order-id: order-id }
      {
        trader: tx-sender,
        symbol: symbol,
        order-type: ORDER-TYPE-MARKET,
        side: side,
        price: market-price,
        amount: amount,
        filled-amount: u0,
        status: ORDER-STATUS-OPEN,
        created-at: block-height,
        expires-at: none
      }
    )

    (var-set next-order-id (+ order-id u1))
    (map-set order-fill-counts order-id u0)

    (print {
      event: "order-placed",
      order-id: order-id,
      trader: tx-sender,
      symbol: symbol,
      side: side,
      order-type: ORDER-TYPE-MARKET,
      price: market-price,
      amount: amount,
      block: block-height
    })

    (ok order-id)
  )
)

;; Cancel an order
(define-public (cancel-order (order-id uint))
  (let ((order (unwrap! (map-get? orders { order-id: order-id }) ERR-ORDER-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get trader order)) ERR-NOT-ORDER-OWNER)
    (asserts! (is-eq (get status order) ORDER-STATUS-OPEN) ERR-ORDER-ALREADY-FILLED)

    (map-set orders
      { order-id: order-id }
      (merge order { status: ORDER-STATUS-CANCELLED })
    )

    (print {
      event: "order-cancelled",
      order-id: order-id,
      trader: tx-sender
    })

    (ok true)
  )
)

;; Fill an order (simplified matching engine)
(define-public (fill-order (order-id uint) (fill-amount uint))
  (let (
    (order (unwrap! (map-get? orders { order-id: order-id }) ERR-ORDER-NOT-FOUND))
    (remaining-amount (- (get amount order) (get filled-amount order)))
    (actual-fill-amount (if (<= fill-amount remaining-amount) fill-amount remaining-amount))
    (new-filled-amount (+ (get filled-amount order) actual-fill-amount))
    (new-status (if (>= new-filled-amount (get amount order)) ORDER-STATUS-FILLED ORDER-STATUS-PARTIAL))
    (fill-id (default-to u0 (map-get? order-fill-counts order-id)))
    (taker-fee (calculate-taker-fee (* actual-fill-amount (get price order))))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (not (is-eq tx-sender (get trader order))) ERR-UNAUTHORIZED)
    (asserts! (is-eq (get status order) ORDER-STATUS-OPEN) ERR-ORDER-ALREADY-FILLED)
    (asserts! (> actual-fill-amount u0) ERR-INVALID-AMOUNT)

    ;; Update order
    (map-set orders
      { order-id: order-id }
      (merge order {
        filled-amount: new-filled-amount,
        status: new-status
      })
    )

    ;; Record fill
    (map-set order-fills
      { order-id: order-id, fill-id: fill-id }
      {
        fill-amount: actual-fill-amount,
        fill-price: (get price order),
        counterparty: tx-sender,
        filled-at: block-height
      }
    )

    (map-set order-fill-counts order-id (+ fill-id u1))

    ;; Update trading stats
    (update-trading-stats (get symbol order) actual-fill-amount (get price order))

    ;; Record user trades
    (record-user-trade (get trader order) (get symbol order) (get side order) actual-fill-amount (get price order))
    (record-user-trade tx-sender (get symbol order) (if (is-eq (get side order) ORDER-SIDE-BUY) ORDER-SIDE-SELL ORDER-SIDE-BUY) actual-fill-amount (get price order))

    ;; Collect fees
    (var-set accumulated-fees (+ (var-get accumulated-fees) taker-fee))

    (print {
      event: "order-filled",
      order-id: order-id,
      fill-amount: actual-fill-amount,
      fill-price: (get price order),
      filler: tx-sender,
      fee: taker-fee,
      new-status: new-status,
      block: block-height
    })

    (ok { filled: actual-fill-amount, fee: taker-fee, status: new-status })
  )
)

;; Helper Functions

(define-private (calculate-taker-fee (amount uint))
  (/ (* amount (var-get taker-fee-bps)) u10000)
)

(define-private (calculate-maker-fee (amount uint))
  (/ (* amount (var-get maker-fee-bps)) u10000)
)

(define-private (update-trading-stats (symbol (string-ascii 32)) (volume uint) (price uint))
  (let ((listing (unwrap-panic (map-get? token-listings { symbol: symbol }))))
    (map-set token-listings
      { symbol: symbol }
      (merge listing {
        trading-volume-24h: (+ (get trading-volume-24h listing) volume),
        price-high-24h: (if (> price (get price-high-24h listing)) price (get price-high-24h listing)),
        price-low-24h: (if (or (is-eq (get price-low-24h listing) u0) (< price (get price-low-24h listing))) price (get price-low-24h listing)),
        last-price: price,
        total-trades: (+ (get total-trades listing) u1)
      })
    )
  )
)

(define-private (record-user-trade (user principal) (symbol (string-ascii 32)) (side uint) (amount uint) (price uint))
  (let ((trade-count (default-to u0 (map-get? user-trade-counts user))))
    (map-set user-trades
      { user: user, trade-id: trade-count }
      {
        symbol: symbol,
        side: side,
        amount: amount,
        price: price,
        timestamp: block-height
      }
    )
    (map-set user-trade-counts user (+ trade-count u1))
  )
)

;; Read-only Functions

(define-read-only (get-token-listing (symbol (string-ascii 32)))
  (map-get? token-listings { symbol: symbol })
)

(define-read-only (is-token-listed (symbol (string-ascii 32)))
  (match (map-get? token-listings { symbol: symbol })
    listing (get active listing)
    false
  )
)

(define-read-only (get-order (order-id uint))
  (map-get? orders { order-id: order-id })
)

(define-read-only (get-order-fills (order-id uint) (fill-id uint))
  (map-get? order-fills { order-id: order-id, fill-id: fill-id })
)

(define-read-only (get-user-trade (user principal) (trade-id uint))
  (map-get? user-trades { user: user, trade-id: trade-id })
)

(define-read-only (get-user-trade-count (user principal))
  (default-to u0 (map-get? user-trade-counts user))
)

(define-read-only (get-trading-stats (symbol (string-ascii 32)) (period uint))
  (map-get? trading-stats { symbol: symbol, period: period })
)

(define-read-only (is-featured (symbol (string-ascii 32)))
  (match (map-get? featured-tokens { symbol: symbol })
    featured (get featured featured)
    false
  )
)

(define-read-only (get-next-order-id)
  (var-get next-order-id))

;; Admin Functions

(define-public (set-featured (symbol (string-ascii 32)) (featured bool))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set featured-tokens
      { symbol: symbol }
      { featured: featured, featured-at: block-height }
    )
    (print { event: "featured-status-updated", symbol: symbol, featured: featured })
    (ok true)
  )
)

(define-public (set-trading-fees (maker-fee uint) (taker-fee uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (<= maker-fee u1000) ERR-INVALID-AMOUNT) ;; Max 10%
    (asserts! (<= taker-fee u1000) ERR-INVALID-AMOUNT) ;; Max 10%
    (var-set maker-fee-bps maker-fee)
    (var-set taker-fee-bps taker-fee)
    (print { event: "trading-fees-updated", maker-fee: maker-fee, taker-fee: taker-fee })
    (ok true)
  )
)

(define-public (set-order-size-limits (minimum uint) (maximum uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (< minimum maximum) ERR-INVALID-AMOUNT)
    (var-set minimum-order-size minimum)
    (var-set maximum-order-size maximum)
    (print { event: "order-size-limits-updated", minimum: minimum, maximum: maximum })
    (ok true)
  )
)

(define-public (withdraw-fees)
  (let ((fees (var-get accumulated-fees)))
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (> fees u0) ERR-INVALID-AMOUNT)
    (var-set accumulated-fees u0)
    (print { event: "fees-withdrawn", amount: fees, recipient: (var-get fee-recipient) })
    (ok fees)
  )
)

(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set contract-paused paused)
    (print { event: "pause-state-changed", paused: paused })
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
  (let ((owner (unwrap! (var-get contract-owner) ERR-NOT-INITIALIZED)))
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (is-eq admin owner)) ERR-UNAUTHORIZED)
    (map-set admins admin false)
    (print { event: "admin-removed", admin: admin })
    (ok true)
  )
)

(define-public (add-verifier (verifier principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set verifiers verifier true)
    (print { event: "verifier-added", verifier: verifier })
    (ok true)
  )
)

(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set verifiers verifier false)
    (print { event: "verifier-removed", verifier: verifier })
    (ok true)
  )
)

(define-read-only (is-admin (address principal))
  (default-to false (map-get? admins address))
)

(define-read-only (is-verifier (address principal))
  (default-to false (map-get? verifiers address))
)

(define-read-only (is-paused)
  (var-get contract-paused))

(define-read-only (get-fees-info)
  (ok {
    maker-fee: (var-get maker-fee-bps),
    taker-fee: (var-get taker-fee-bps),
    accumulated: (var-get accumulated-fees),
    recipient: (var-get fee-recipient)
  })
)
