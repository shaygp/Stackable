;; Liquidity Pool Contract
;; Automated market maker for token swaps

;; Constants
(define-constant ERR-UNAUTHORIZED (err u7000))
(define-constant ERR-INSUFFICIENT-LIQUIDITY (err u7001))
(define-constant ERR-SLIPPAGE-EXCEEDED (err u7002))
(define-constant ERR-INVALID-AMOUNT (err u7003))
(define-constant ERR-INSUFFICIENT-LP-TOKENS (err u7004))
(define-constant ERR-NOT-INITIALIZED (err u7005))
(define-constant ERR-ZERO-AMOUNT (err u7006))

;; Data variables
(define-data-var contract-owner (optional principal) none)
(define-data-var reserve-stx uint u0)
(define-data-var reserve-token uint u0)
(define-data-var total-lp-supply uint u0)
(define-data-var trading-fee uint u30)
(define-data-var protocol-fee-collected uint u0)

;; LP token balances
(define-map lp-balances
  { holder: principal }
  { amount: uint }
)

;; Admin map
(define-map admins principal bool)

;; Initialize contract
(define-public (initialize (owner principal))
  (begin
    (asserts! (is-none (var-get contract-owner)) ERR-UNAUTHORIZED)
    (var-set contract-owner (some owner))
    (map-set admins owner true)
    (ok true)
  )
)

;; Add liquidity
(define-public (add-liquidity (stx-amount uint) (token-amount uint) (min-lp-tokens uint))
  (let (
    (current-stx (var-get reserve-stx))
    (current-token (var-get reserve-token))
    (lp-supply (var-get total-lp-supply))
    (provider tx-sender)
  )
    (asserts! (and (> stx-amount u0) (> token-amount u0)) ERR-INVALID-AMOUNT)

    (let (
      (lp-minted
        (if (is-eq lp-supply u0)
          (sqrti (* stx-amount token-amount))
          (min
            (/ (* stx-amount lp-supply) current-stx)
            (/ (* token-amount lp-supply) current-token)
          )
        )
      )
    )
      (asserts! (>= lp-minted min-lp-tokens) ERR-SLIPPAGE-EXCEEDED)

      (try! (stx-transfer? stx-amount provider (as-contract tx-sender)))

      (let (
        (current-balance (default-to u0 (get amount (map-get? lp-balances { holder: provider }))))
      )
        (map-set lp-balances
          { holder: provider }
          { amount: (+ current-balance lp-minted) }
        )
      )

      (var-set reserve-stx (+ current-stx stx-amount))
      (var-set reserve-token (+ current-token token-amount))
      (var-set total-lp-supply (+ lp-supply lp-minted))

      (print {
        event: "liquidity-added",
        provider: provider,
        stx-amount: stx-amount,
        token-amount: token-amount,
        lp-minted: lp-minted,
        block: block-height
      })

      (ok lp-minted)
    )
  )
)

;; Remove liquidity
(define-public (remove-liquidity (lp-amount uint) (min-stx uint) (min-token uint))
  (let (
    (provider tx-sender)
    (current-stx (var-get reserve-stx))
    (current-token (var-get reserve-token))
    (lp-supply (var-get total-lp-supply))
    (user-balance (default-to u0 (get amount (map-get? lp-balances { holder: provider }))))
  )
    (asserts! (> lp-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (>= user-balance lp-amount) ERR-INSUFFICIENT-LP-TOKENS)

    (let (
      (stx-out (/ (* lp-amount current-stx) lp-supply))
      (token-out (/ (* lp-amount current-token) lp-supply))
    )
      (asserts! (>= stx-out min-stx) ERR-SLIPPAGE-EXCEEDED)
      (asserts! (>= token-out min-token) ERR-SLIPPAGE-EXCEEDED)

      (try! (as-contract (stx-transfer? stx-out (as-contract tx-sender) provider)))

      (map-set lp-balances
        { holder: provider }
        { amount: (- user-balance lp-amount) }
      )

      (var-set reserve-stx (- current-stx stx-out))
      (var-set reserve-token (- current-token token-out))
      (var-set total-lp-supply (- lp-supply lp-amount))

      (print {
        event: "liquidity-removed",
        provider: provider,
        lp-amount: lp-amount,
        stx-out: stx-out,
        token-out: token-out,
        block: block-height
      })

      (ok { stx: stx-out, token: token-out })
    )
  )
)

;; Swap STX for tokens
(define-public (swap-stx-for-token (stx-in uint) (min-token-out uint))
  (let (
    (reserve-stx-current (var-get reserve-stx))
    (reserve-token-current (var-get reserve-token))
    (fee (/ (* stx-in (var-get trading-fee)) u10000))
    (stx-after-fee (- stx-in fee))
  )
    (asserts! (> stx-in u0) ERR-ZERO-AMOUNT)

    (let (
      (token-out (get-amount-out stx-after-fee reserve-stx-current reserve-token-current))
    )
      (asserts! (>= token-out min-token-out) ERR-SLIPPAGE-EXCEEDED)
      (asserts! (> token-out u0) ERR-INSUFFICIENT-LIQUIDITY)

      (try! (stx-transfer? stx-in tx-sender (as-contract tx-sender)))

      (var-set reserve-stx (+ reserve-stx-current stx-after-fee))
      (var-set reserve-token (- reserve-token-current token-out))
      (var-set protocol-fee-collected (+ (var-get protocol-fee-collected) fee))

      (print {
        event: "swap",
        trader: tx-sender,
        stx-in: stx-in,
        token-out: token-out,
        fee: fee,
        block: block-height
      })

      (ok token-out)
    )
  )
)

;; Swap tokens for STX
(define-public (swap-token-for-stx (token-in uint) (min-stx-out uint))
  (let (
    (reserve-stx-current (var-get reserve-stx))
    (reserve-token-current (var-get reserve-token))
    (fee (/ (* token-in (var-get trading-fee)) u10000))
    (token-after-fee (- token-in fee))
  )
    (asserts! (> token-in u0) ERR-ZERO-AMOUNT)

    (let (
      (stx-out (get-amount-out token-after-fee reserve-token-current reserve-stx-current))
    )
      (asserts! (>= stx-out min-stx-out) ERR-SLIPPAGE-EXCEEDED)
      (asserts! (> stx-out u0) ERR-INSUFFICIENT-LIQUIDITY)

      (try! (as-contract (stx-transfer? stx-out (as-contract tx-sender) tx-sender)))

      (var-set reserve-stx (- reserve-stx-current stx-out))
      (var-set reserve-token (+ reserve-token-current token-after-fee))

      (print {
        event: "swap",
        trader: tx-sender,
        token-in: token-in,
        stx-out: stx-out,
        fee: fee,
        block: block-height
      })

      (ok stx-out)
    )
  )
)

;; Calculate output amount using constant product formula
(define-private (get-amount-out (amount-in uint) (reserve-in uint) (reserve-out uint))
  (let (
    (numerator (* amount-in reserve-out))
    (denominator (+ reserve-in amount-in))
  )
    (/ numerator denominator)
  )
)

;; Helper: Square root approximation
(define-private (sqrti (n uint))
  (if (<= n u1)
    n
    (let ((x (/ n u2)))
      (sqrti-iter x n)
    )
  )
)

(define-private (sqrti-iter (guess uint) (n uint))
  (let ((next-guess (/ (+ guess (/ n guess)) u2)))
    (if (or (is-eq guess next-guess) (< (- guess next-guess) u2))
      guess
      (sqrti-iter next-guess n)
    )
  )
)

;; Helper: Min function
(define-private (min (a uint) (b uint))
  (if (< a b) a b)
)

;; Read-only functions
(define-read-only (get-reserves)
  (ok {
    stx: (var-get reserve-stx),
    token: (var-get reserve-token)
  })
)

(define-read-only (get-lp-balance (holder principal))
  (ok (default-to u0 (get amount (map-get? lp-balances { holder: holder }))))
)

(define-read-only (get-total-lp-supply)
  (ok (var-get total-lp-supply))
)

(define-read-only (quote-swap-stx-for-token (stx-in uint))
  (let (
    (reserve-stx-current (var-get reserve-stx))
    (reserve-token-current (var-get reserve-token))
    (fee (/ (* stx-in (var-get trading-fee)) u10000))
    (stx-after-fee (- stx-in fee))
  )
    (ok (get-amount-out stx-after-fee reserve-stx-current reserve-token-current))
  )
)

(define-read-only (quote-swap-token-for-stx (token-in uint))
  (let (
    (reserve-stx-current (var-get reserve-stx))
    (reserve-token-current (var-get reserve-token))
    (fee (/ (* token-in (var-get trading-fee)) u10000))
    (token-after-fee (- token-in fee))
  )
    (ok (get-amount-out token-after-fee reserve-token-current reserve-stx-current))
  )
)

;; Admin functions
(define-public (set-trading-fee (new-fee uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (<= new-fee u1000) ERR-INVALID-AMOUNT)
    (var-set trading-fee new-fee)
    (ok true)
  )
)

(define-public (withdraw-protocol-fees (recipient principal))
  (let ((fees (var-get protocol-fee-collected)))
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (> fees u0) ERR-ZERO-AMOUNT)

    (try! (as-contract (stx-transfer? fees (as-contract tx-sender) recipient)))
    (var-set protocol-fee-collected u0)

    (ok fees)
  )
)

(define-read-only (is-admin (address principal))
  (default-to false (map-get? admins address))
)
