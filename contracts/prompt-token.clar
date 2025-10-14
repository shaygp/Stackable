;; Advanced PromptToken Contract - SIP-010 Compliant
;; Comprehensive fungible token implementation with advanced features

(impl-trait .sip010-token-trait.sip010-ft-trait)

;; Constants
(define-constant TOKEN-NAME "Stackable Token")
(define-constant TOKEN-SYMBOL "STACK")
(define-constant TOKEN-DECIMALS u6)
(define-constant TOKEN-URI u"https://stackable.app/token-metadata.json")

;; Error codes
(define-constant ERR-UNAUTHORIZED (err u1000))
(define-constant ERR-NOT-TOKEN-OWNER (err u1001))
(define-constant ERR-INSUFFICIENT-BALANCE (err u1002))
(define-constant ERR-TOKEN-NOT-FOUND (err u1003))
(define-constant ERR-TOKEN-ALREADY-EXISTS (err u1004))
(define-constant ERR-INVALID-AMOUNT (err u1005))
(define-constant ERR-TRANSFER-FAILED (err u1006))
(define-constant ERR-PAUSED (err u1007))
(define-constant ERR-BLACKLISTED (err u1008))
(define-constant ERR-MAX-SUPPLY-REACHED (err u1009))
(define-constant ERR-INVALID-RECIPIENT (err u1010))
(define-constant ERR-NOT-INITIALIZED (err u1011))

;; Data Variables
(define-data-var token-name (string-ascii 32) TOKEN-NAME)
(define-data-var token-symbol (string-ascii 32) TOKEN-SYMBOL)
(define-data-var token-uri (optional (string-utf8 256)) (some TOKEN-URI))
(define-data-var token-decimals uint TOKEN-DECIMALS)
(define-data-var total-supply uint u0)
(define-data-var max-supply uint u1000000000000)
(define-data-var contract-paused bool false)
(define-data-var contract-owner (optional principal) none)

;; Token balances
(define-map balances principal uint)

;; Allowances for delegated transfers
(define-map allowances { owner: principal, spender: principal } uint)

;; Token metadata registry
(define-map token-metadata
  { token-id: (string-ascii 64) }
  {
    name: (string-utf8 256),
    symbol: (string-ascii 32),
    creator: principal,
    created-at: uint,
    total-supply: uint,
    metadata-uri: (optional (string-utf8 256))
  }
)

;; Blacklist for security
(define-map blacklisted-addresses principal bool)

;; Admin roles
(define-map admins principal bool)

;; Minter roles
(define-map minters principal bool)

;; Token holder registry for airdrops/snapshots
(define-map token-holders { holder: principal } { first-tx: uint, last-tx: uint })

;; Transfer history (last 100 per user)
(define-map transfer-history
  { user: principal, index: uint }
  { from: principal, to: principal, amount: uint, block: uint }
)
(define-map transfer-counts principal uint)

;; Initialize the contract
(define-public (initialize (owner principal))
  (begin
    (asserts! (is-none (var-get contract-owner)) ERR-UNAUTHORIZED)
    (var-set contract-owner (some owner))
    (map-set admins owner true)
    (map-set minters owner true)
    (ok true)
  )
)

;; SIP-010 Functions

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (is-eq tx-sender sender) ERR-UNAUTHORIZED)
    (asserts! (not (is-blacklisted sender)) ERR-BLACKLISTED)
    (asserts! (not (is-blacklisted recipient)) ERR-BLACKLISTED)
    (asserts! (not (is-eq recipient tx-sender)) ERR-INVALID-RECIPIENT)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (let ((sender-balance (get-balance-or-default sender)))
      (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)

      ;; Update balances
      (map-set balances sender (- sender-balance amount))
      (map-set balances recipient (+ (get-balance-or-default recipient) amount))

      ;; Record transfer history
      (record-transfer sender recipient amount)

      ;; Update token holder registry
      (update-holder-registry sender)
      (update-holder-registry recipient)

      ;; Emit transfer event
      (print {
        event: "transfer",
        from: sender,
        to: recipient,
        amount: amount,
        memo: memo,
        block: block-height
      })

      (ok true)
    )
  )
)

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok (var-get token-decimals))
)

(define-read-only (get-balance (account principal))
  (ok (get-balance-or-default account))
)

(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Advanced Functions

;; Mint new tokens (only minters)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-minter tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (let ((new-supply (+ (var-get total-supply) amount)))
      (asserts! (<= new-supply (var-get max-supply)) ERR-MAX-SUPPLY-REACHED)

      (var-set total-supply new-supply)
      (map-set balances recipient (+ (get-balance-or-default recipient) amount))

      (update-holder-registry recipient)

      (print {
        event: "mint",
        recipient: recipient,
        amount: amount,
        new-supply: new-supply,
        block: block-height
      })

      (ok true)
    )
  )
)

;; Burn tokens
(define-public (burn (amount uint))
  (let ((sender-balance (get-balance-or-default tx-sender)))
    (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (map-set balances tx-sender (- sender-balance amount))
    (var-set total-supply (- (var-get total-supply) amount))

    (print {
      event: "burn",
      burner: tx-sender,
      amount: amount,
      new-supply: (var-get total-supply),
      block: block-height
    })

    (ok true)
  )
)

;; Approve spender allowance
(define-public (approve (spender principal) (amount uint))
  (begin
    (asserts! (not (is-eq spender tx-sender)) ERR-INVALID-RECIPIENT)
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)

    (map-set allowances { owner: tx-sender, spender: spender } amount)

    (print {
      event: "approval",
      owner: tx-sender,
      spender: spender,
      amount: amount,
      block: block-height
    })

    (ok true)
  )
)

;; Transfer from approved allowance
(define-public (transfer-from (amount uint) (owner principal) (recipient principal))
  (let (
    (allowance (get-allowance owner tx-sender))
    (owner-balance (get-balance-or-default owner))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (not (is-blacklisted owner)) ERR-BLACKLISTED)
    (asserts! (not (is-blacklisted recipient)) ERR-BLACKLISTED)
    (asserts! (>= allowance amount) ERR-UNAUTHORIZED)
    (asserts! (>= owner-balance amount) ERR-INSUFFICIENT-BALANCE)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    ;; Update allowance
    (map-set allowances { owner: owner, spender: tx-sender } (- allowance amount))

    ;; Update balances
    (map-set balances owner (- owner-balance amount))
    (map-set balances recipient (+ (get-balance-or-default recipient) amount))

    (record-transfer owner recipient amount)
    (update-holder-registry owner)
    (update-holder-registry recipient)

    (print {
      event: "transfer-from",
      spender: tx-sender,
      from: owner,
      to: recipient,
      amount: amount,
      block: block-height
    })

    (ok true)
  )
)

;; Admin Functions

(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set contract-paused paused)
    (print { event: "pause-state-changed", paused: paused })
    (ok true)
  )
)

(define-public (set-max-supply (new-max uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (>= new-max (var-get total-supply)) ERR-INVALID-AMOUNT)
    (var-set max-supply new-max)
    (print { event: "max-supply-updated", new-max: new-max })
    (ok true)
  )
)

(define-public (add-admin (new-admin principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set admins new-admin true)
    (print { event: "admin-added", admin: new-admin })
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

(define-public (add-minter (new-minter principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set minters new-minter true)
    (print { event: "minter-added", minter: new-minter })
    (ok true)
  )
)

(define-public (remove-minter (minter principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set minters minter false)
    (print { event: "minter-removed", minter: minter })
    (ok true)
  )
)

(define-public (blacklist-address (address principal) (blacklist bool))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set blacklisted-addresses address blacklist)
    (print { event: "blacklist-updated", address: address, blacklisted: blacklist })
    (ok true)
  )
)

;; Helper Functions

(define-private (get-balance-or-default (account principal))
  (default-to u0 (map-get? balances account))
)

(define-read-only (get-allowance (owner principal) (spender principal))
  (default-to u0 (map-get? allowances { owner: owner, spender: spender }))
)

(define-read-only (is-admin (address principal))
  (default-to false (map-get? admins address))
)

(define-read-only (is-minter (address principal))
  (default-to false (map-get? minters address))
)

(define-read-only (is-blacklisted (address principal))
  (default-to false (map-get? blacklisted-addresses address))
)

(define-read-only (is-paused)
  (var-get contract-paused)
)

(define-read-only (get-max-supply)
  (ok (var-get max-supply))
)

(define-private (record-transfer (from principal) (to principal) (amount uint))
  (let ((count (default-to u0 (map-get? transfer-counts from))))
    (map-set transfer-history
      { user: from, index: (mod count u100) }
      { from: from, to: to, amount: amount, block: block-height }
    )
    (map-set transfer-counts from (+ count u1))
  )
)

(define-private (update-holder-registry (holder principal))
  (match (map-get? token-holders { holder: holder })
    existing (map-set token-holders
      { holder: holder }
      { first-tx: (get first-tx existing), last-tx: block-height }
    )
    (map-set token-holders
      { holder: holder }
      { first-tx: block-height, last-tx: block-height }
    )
  )
)

(define-read-only (get-holder-info (holder principal))
  (map-get? token-holders { holder: holder })
)

(define-read-only (get-transfer-history (user principal) (index uint))
  (map-get? transfer-history { user: user, index: index })
)

;; Batch operations

(define-public (batch-transfer (recipients (list 50 { to: principal, amount: uint })))
  (begin
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (ok (fold batch-transfer-iter recipients { sender: tx-sender, success: true }))
  )
)

(define-private (batch-transfer-iter (recipient { to: principal, amount: uint }) (state { sender: principal, success: bool }))
  (if (get success state)
    (match (transfer (get amount recipient) (get sender state) (get to recipient) none)
      success state
      error { sender: (get sender state), success: false }
    )
    state
  )
)

;; Token metadata management

(define-public (register-token-metadata
  (token-id (string-ascii 64))
  (name (string-utf8 256))
  (symbol (string-ascii 32))
  (supply uint)
  (metadata-uri (optional (string-utf8 256))))
  (begin
    (asserts! (is-none (map-get? token-metadata { token-id: token-id })) ERR-TOKEN-ALREADY-EXISTS)

    (ok (map-set token-metadata
      { token-id: token-id }
      {
        name: name,
        symbol: symbol,
        creator: tx-sender,
        created-at: block-height,
        total-supply: supply,
        metadata-uri: metadata-uri
      }
    ))
  )
)

(define-read-only (get-token-metadata (token-id (string-ascii 64)))
  (map-get? token-metadata { token-id: token-id })
)
