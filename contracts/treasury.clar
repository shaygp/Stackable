;; Treasury Contract
;; Manages protocol funds with multi-sig capabilities and timelock

;; Constants
(define-constant ERR-UNAUTHORIZED (err u8000))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u8001))
(define-constant ERR-ALREADY-EXECUTED (err u8002))
(define-constant ERR-TIMELOCK-ACTIVE (err u8003))
(define-constant ERR-INSUFFICIENT-APPROVALS (err u8004))
(define-constant ERR-ALREADY-APPROVED (err u8005))
(define-constant ERR-INVALID-AMOUNT (err u8006))
(define-constant ERR-NOT-INITIALIZED (err u8007))
(define-constant ERR-TRANSFER-FAILED (err u8008))

;; Data variables
(define-data-var contract-owner (optional principal) none)
(define-data-var next-proposal-id uint u0)
(define-data-var required-approvals uint u2)
(define-data-var timelock-duration uint u144)
(define-data-var total-signers uint u0)

;; Proposal structure
(define-map proposals
  { proposal-id: uint }
  {
    proposer: principal,
    recipient: principal,
    amount: uint,
    description: (string-utf8 256),
    created-at: uint,
    executed-at: (optional uint),
    approval-count: uint,
    executed: bool
  }
)

;; Approval tracking
(define-map proposal-approvals
  { proposal-id: uint, signer: principal }
  { approved: bool }
)

;; Authorized signers
(define-map signers
  { signer: principal }
  { active: bool, added-at: uint }
)

;; Initialize contract
(define-public (initialize (owner principal))
  (begin
    (asserts! (is-none (var-get contract-owner)) ERR-UNAUTHORIZED)
    (var-set contract-owner (some owner))
    (map-set signers { signer: owner } { active: true, added-at: block-height })
    (var-set total-signers u1)
    (ok true)
  )
)

;; Create spending proposal
(define-public (create-proposal (recipient principal) (amount uint) (description (string-utf8 256)))
  (let (
    (proposal-id (var-get next-proposal-id))
  )
    (asserts! (is-signer tx-sender) ERR-UNAUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (map-set proposals
      { proposal-id: proposal-id }
      {
        proposer: tx-sender,
        recipient: recipient,
        amount: amount,
        description: description,
        created-at: block-height,
        executed-at: none,
        approval-count: u0,
        executed: false
      }
    )

    (var-set next-proposal-id (+ proposal-id u1))

    (print {
      event: "proposal-created",
      proposal-id: proposal-id,
      proposer: tx-sender,
      recipient: recipient,
      amount: amount,
      block: block-height
    })

    (ok proposal-id)
  )
)

;; Approve proposal
(define-public (approve-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-PROPOSAL-NOT-FOUND))
    (already-approved (default-to false
      (get approved (map-get? proposal-approvals { proposal-id: proposal-id, signer: tx-sender }))))
  )
    (asserts! (is-signer tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    (asserts! (not already-approved) ERR-ALREADY-APPROVED)

    (map-set proposal-approvals
      { proposal-id: proposal-id, signer: tx-sender }
      { approved: true }
    )

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal { approval-count: (+ (get approval-count proposal) u1) })
    )

    (print {
      event: "proposal-approved",
      proposal-id: proposal-id,
      signer: tx-sender,
      approval-count: (+ (get approval-count proposal) u1),
      block: block-height
    })

    (ok true)
  )
)

;; Execute approved proposal
(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-PROPOSAL-NOT-FOUND))
  )
    (asserts! (is-signer tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (get executed proposal)) ERR-ALREADY-EXECUTED)
    (asserts! (>= (get approval-count proposal) (var-get required-approvals)) ERR-INSUFFICIENT-APPROVALS)
    (asserts! (>= block-height (+ (get created-at proposal) (var-get timelock-duration))) ERR-TIMELOCK-ACTIVE)

    (try! (as-contract (stx-transfer?
      (get amount proposal)
      (as-contract tx-sender)
      (get recipient proposal)
    )))

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        executed: true,
        executed-at: (some block-height)
      })
    )

    (print {
      event: "proposal-executed",
      proposal-id: proposal-id,
      recipient: (get recipient proposal),
      amount: (get amount proposal),
      block: block-height
    })

    (ok true)
  )
)

;; Add new signer
(define-public (add-signer (new-signer principal))
  (let (
    (owner (unwrap! (var-get contract-owner) ERR-NOT-INITIALIZED))
  )
    (asserts! (is-eq tx-sender owner) ERR-UNAUTHORIZED)

    (map-set signers
      { signer: new-signer }
      { active: true, added-at: block-height }
    )

    (var-set total-signers (+ (var-get total-signers) u1))

    (print {
      event: "signer-added",
      signer: new-signer,
      block: block-height
    })

    (ok true)
  )
)

;; Remove signer
(define-public (remove-signer (signer-to-remove principal))
  (let (
    (owner (unwrap! (var-get contract-owner) ERR-NOT-INITIALIZED))
  )
    (asserts! (is-eq tx-sender owner) ERR-UNAUTHORIZED)
    (asserts! (not (is-eq signer-to-remove owner)) ERR-UNAUTHORIZED)

    (map-set signers
      { signer: signer-to-remove }
      { active: false, added-at: u0 }
    )

    (var-set total-signers (- (var-get total-signers) u1))

    (print {
      event: "signer-removed",
      signer: signer-to-remove,
      block: block-height
    })

    (ok true)
  )
)

;; Update required approvals
(define-public (set-required-approvals (new-requirement uint))
  (let (
    (owner (unwrap! (var-get contract-owner) ERR-NOT-INITIALIZED))
  )
    (asserts! (is-eq tx-sender owner) ERR-UNAUTHORIZED)
    (asserts! (and (> new-requirement u0) (<= new-requirement (var-get total-signers))) ERR-INVALID-AMOUNT)

    (var-set required-approvals new-requirement)

    (ok true)
  )
)

;; Update timelock duration
(define-public (set-timelock-duration (blocks uint))
  (let (
    (owner (unwrap! (var-get contract-owner) ERR-NOT-INITIALIZED))
  )
    (asserts! (is-eq tx-sender owner) ERR-UNAUTHORIZED)

    (var-set timelock-duration blocks)

    (ok true)
  )
)

;; Deposit funds
(define-public (deposit (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    (print {
      event: "deposit",
      depositor: tx-sender,
      amount: amount,
      block: block-height
    })

    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (has-approved (proposal-id uint) (signer principal))
  (default-to false
    (get approved (map-get? proposal-approvals { proposal-id: proposal-id, signer: signer }))
  )
)

(define-read-only (is-signer (address principal))
  (default-to false
    (get active (map-get? signers { signer: address }))
  )
)

(define-read-only (get-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)

(define-read-only (get-required-approvals)
  (ok (var-get required-approvals))
)

(define-read-only (get-total-signers)
  (ok (var-get total-signers))
)

(define-read-only (get-timelock-duration)
  (ok (var-get timelock-duration))
)
