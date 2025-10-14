;; Governance Contract for Stacks
;; DAO governance system with proposals, voting, and timelock execution

;; Constants
(define-constant CONTRACT-OWNER tx-sender)

;; Proposal states
(define-constant PROPOSAL-STATE-PENDING u0)
(define-constant PROPOSAL-STATE-ACTIVE u1)
(define-constant PROPOSAL-STATE-DEFEATED u2)
(define-constant PROPOSAL-STATE-SUCCEEDED u3)
(define-constant PROPOSAL-STATE-QUEUED u4)
(define-constant PROPOSAL-STATE-EXECUTED u5)
(define-constant PROPOSAL-STATE-CANCELLED u6)
(define-constant PROPOSAL-STATE-EXPIRED u7)

;; Proposal types
(define-constant PROPOSAL-TYPE-PARAMETER u0)
(define-constant PROPOSAL-TYPE-UPGRADE u1)
(define-constant PROPOSAL-TYPE-TREASURY u2)
(define-constant PROPOSAL-TYPE-EMERGENCY u3)

;; Error codes
(define-constant ERR-UNAUTHORIZED (err u5000))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u5001))
(define-constant ERR-ALREADY-VOTED (err u5002))
(define-constant ERR-VOTING-CLOSED (err u5003))
(define-constant ERR-INSUFFICIENT-VOTING-POWER (err u5004))
(define-constant ERR-PROPOSAL-NOT-ACTIVE (err u5005))
(define-constant ERR-PROPOSAL-NOT-SUCCEEDED (err u5006))
(define-constant ERR-TIMELOCK-NOT-MET (err u5007))
(define-constant ERR-PROPOSAL-EXPIRED (err u5008))
(define-constant ERR-INVALID-PROPOSAL-TYPE (err u5009))
(define-constant ERR-QUORUM-NOT-MET (err u5010))

;; Data structures

;; Governance parameters
(define-data-var voting-period uint u1008) ;; ~1 week in blocks
(define-data-var voting-delay uint u144) ;; ~1 day in blocks
(define-data-var proposal-threshold uint u1000) ;; Minimum voting power to propose
(define-data-var quorum-percentage uint u400) ;; 4% quorum
(define-data-var timelock-delay uint u288) ;; ~2 days in blocks
(define-data-var execution-grace-period uint u1008) ;; ~1 week grace period

;; Proposals
(define-map proposals
  { proposal-id: uint }
  {
    proposer: principal,
    title: (string-utf8 256),
    description: (string-utf8 1024),
    proposal-type: uint,
    start-block: uint,
    end-block: uint,
    for-votes: uint,
    against-votes: uint,
    abstain-votes: uint,
    state: uint,
    queued-at: (optional uint),
    executed-at: (optional uint),
    cancelled-at: (optional uint),
    metadata-uri: (optional (string-utf8 256))
  }
)

(define-data-var next-proposal-id uint u1)

;; Proposal actions (executable code)
(define-map proposal-actions
  { proposal-id: uint, action-id: uint }
  {
    target-contract: principal,
    function-name: (string-ascii 128),
    arguments: (buff 1024)
  }
)

(define-map proposal-action-counts uint uint)

;; Votes
(define-map votes
  { proposal-id: uint, voter: principal }
  {
    support: uint, ;; 0=against, 1=for, 2=abstain
    voting-power: uint,
    voted-at: uint,
    reason: (optional (string-utf8 512))
  }
)

;; Voting power snapshots
(define-map voting-power-snapshots
  { user: principal, block-height: uint }
  { power: uint }
)

;; Delegate system
(define-map delegations
  { delegator: principal }
  { delegate: principal, delegated-at: uint }
)

;; Vote receipts for accountability
(define-map vote-receipts
  { receipt-id: uint }
  {
    proposal-id: uint,
    voter: principal,
    support: uint,
    voting-power: uint,
    block-height: uint
  }
)

(define-data-var next-receipt-id uint u0)

;; Governance token holders registry
(define-map governance-token-holders
  { holder: principal }
  {
    balance: uint,
    delegated-votes: uint,
    proposals-created: uint,
    votes-cast: uint
  }
)

;; Admin and guardian roles
(define-map guardians principal bool)
(map-set guardians CONTRACT-OWNER true)

;; Proposal Functions

;; Create a new proposal
(define-public (propose
  (title (string-utf8 256))
  (description (string-utf8 1024))
  (proposal-type uint)
  (metadata-uri (optional (string-utf8 256))))
  (let (
    (proposer-power (get-voting-power tx-sender block-height))
    (proposal-id (var-get next-proposal-id))
    (start-block (+ block-height (var-get voting-delay)))
    (end-block (+ start-block (var-get voting-period)))
  )
    (asserts! (>= proposer-power (var-get proposal-threshold)) ERR-INSUFFICIENT-VOTING-POWER)
    (asserts! (<= proposal-type PROPOSAL-TYPE-EMERGENCY) ERR-INVALID-PROPOSAL-TYPE)

    (map-set proposals
      { proposal-id: proposal-id }
      {
        proposer: tx-sender,
        title: title,
        description: description,
        proposal-type: proposal-type,
        start-block: start-block,
        end-block: end-block,
        for-votes: u0,
        against-votes: u0,
        abstain-votes: u0,
        state: PROPOSAL-STATE-PENDING,
        queued-at: none,
        executed-at: none,
        cancelled-at: none,
        metadata-uri: metadata-uri
      }
    )

    (var-set next-proposal-id (+ proposal-id u1))
    (map-set proposal-action-counts proposal-id u0)

    ;; Update proposer stats
    (update-holder-stats tx-sender u0 u0 u1 u0)

    (print {
      event: "proposal-created",
      proposal-id: proposal-id,
      proposer: tx-sender,
      title: title,
      start-block: start-block,
      end-block: end-block,
      block: block-height
    })

    (ok proposal-id)
  )
)

;; Cast a vote on a proposal
(define-public (cast-vote
  (proposal-id uint)
  (support uint)
  (reason (optional (string-utf8 512))))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-PROPOSAL-NOT-FOUND))
    (voter-power (get-voting-power tx-sender (get start-block proposal)))
    (existing-vote (map-get? votes { proposal-id: proposal-id, voter: tx-sender }))
  )
    (asserts! (is-none existing-vote) ERR-ALREADY-VOTED)
    (asserts! (>= block-height (get start-block proposal)) ERR-PROPOSAL-NOT-ACTIVE)
    (asserts! (<= block-height (get end-block proposal)) ERR-VOTING-CLOSED)
    (asserts! (> voter-power u0) ERR-INSUFFICIENT-VOTING-POWER)
    (asserts! (<= support u2) ERR-UNAUTHORIZED) ;; 0=against, 1=for, 2=abstain

    ;; Record vote
    (map-set votes
      { proposal-id: proposal-id, voter: tx-sender }
      {
        support: support,
        voting-power: voter-power,
        voted-at: block-height,
        reason: reason
      }
    )

    ;; Update vote counts
    (let ((new-proposal
      (merge proposal {
        for-votes: (if (is-eq support u1) (+ (get for-votes proposal) voter-power) (get for-votes proposal)),
        against-votes: (if (is-eq support u0) (+ (get against-votes proposal) voter-power) (get against-votes proposal)),
        abstain-votes: (if (is-eq support u2) (+ (get abstain-votes proposal) voter-power) (get abstain-votes proposal))
      })))
      (map-set proposals { proposal-id: proposal-id } new-proposal)
    )

    ;; Create vote receipt
    (let ((receipt-id (var-get next-receipt-id)))
      (map-set vote-receipts
        { receipt-id: receipt-id }
        {
          proposal-id: proposal-id,
          voter: tx-sender,
          support: support,
          voting-power: voter-power,
          block-height: block-height
        }
      )
      (var-set next-receipt-id (+ receipt-id u1))
    )

    ;; Update voter stats
    (update-holder-stats tx-sender u0 u0 u0 u1)

    (print {
      event: "vote-cast",
      proposal-id: proposal-id,
      voter: tx-sender,
      support: support,
      voting-power: voter-power,
      block: block-height
    })

    (ok true)
  )
)

;; Queue a succeeded proposal for execution
(define-public (queue-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-PROPOSAL-NOT-FOUND)))
    (asserts! (> block-height (get end-block proposal)) ERR-VOTING-CLOSED)
    (asserts! (is-proposal-succeeded proposal-id) ERR-PROPOSAL-NOT-SUCCEEDED)

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        state: PROPOSAL-STATE-QUEUED,
        queued-at: (some block-height)
      })
    )

    (print {
      event: "proposal-queued",
      proposal-id: proposal-id,
      queued-at: block-height,
      executable-after: (+ block-height (var-get timelock-delay))
    })

    (ok true)
  )
)

;; Execute a queued proposal
(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-PROPOSAL-NOT-FOUND))
    (queued-at (unwrap! (get queued-at proposal) ERR-PROPOSAL-NOT-SUCCEEDED))
    (timelock-met (>= block-height (+ queued-at (var-get timelock-delay))))
    (grace-period-met (<= block-height (+ queued-at (var-get timelock-delay) (var-get execution-grace-period))))
  )
    (asserts! (is-eq (get state proposal) PROPOSAL-STATE-QUEUED) ERR-PROPOSAL-NOT-SUCCEEDED)
    (asserts! timelock-met ERR-TIMELOCK-NOT-MET)
    (asserts! grace-period-met ERR-PROPOSAL-EXPIRED)

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        state: PROPOSAL-STATE-EXECUTED,
        executed-at: (some block-height)
      })
    )

    (print {
      event: "proposal-executed",
      proposal-id: proposal-id,
      executed-at: block-height
    })

    (ok true)
  )
)

;; Cancel a proposal (guardian or proposer only)
(define-public (cancel-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals { proposal-id: proposal-id }) ERR-PROPOSAL-NOT-FOUND)))
    (asserts! (or
      (is-guardian tx-sender)
      (is-eq tx-sender (get proposer proposal))
    ) ERR-UNAUTHORIZED)

    (map-set proposals
      { proposal-id: proposal-id }
      (merge proposal {
        state: PROPOSAL-STATE-CANCELLED,
        cancelled-at: (some block-height)
      })
    )

    (print {
      event: "proposal-cancelled",
      proposal-id: proposal-id,
      cancelled-by: tx-sender
    })

    (ok true)
  )
)

;; Delegation Functions

;; Delegate voting power to another address
(define-public (delegate (delegate principal))
  (begin
    (asserts! (not (is-eq tx-sender delegate)) ERR-UNAUTHORIZED)

    (map-set delegations
      { delegator: tx-sender }
      { delegate: delegate, delegated-at: block-height }
    )

    (print {
      event: "votes-delegated",
      delegator: tx-sender,
      delegate: delegate,
      block: block-height
    })

    (ok true)
  )
)

;; Remove delegation
(define-public (undelegate)
  (begin
    (map-delete delegations { delegator: tx-sender })

    (print {
      event: "votes-undelegated",
      delegator: tx-sender,
      block: block-height
    })

    (ok true)
  )
)

;; Helper Functions

(define-private (is-proposal-succeeded (proposal-id uint))
  (match (map-get? proposals { proposal-id: proposal-id })
    proposal
      (let (
        (total-votes (+ (+ (get for-votes proposal) (get against-votes proposal)) (get abstain-votes proposal)))
        (quorum-met (>= total-votes (calculate-quorum)))
        (majority-met (> (get for-votes proposal) (get against-votes proposal)))
      )
        (and quorum-met majority-met)
      )
    false
  )
)

(define-private (calculate-quorum)
  ;; In production, this would calculate based on total voting power
  u1000
)

(define-private (update-holder-stats (holder principal) (balance-delta uint) (delegated-delta uint) (proposals-delta uint) (votes-delta uint))
  (let ((stats (default-to
    { balance: u0, delegated-votes: u0, proposals-created: u0, votes-cast: u0 }
    (map-get? governance-token-holders { holder: holder }))))
    (map-set governance-token-holders
      { holder: holder }
      {
        balance: (+ (get balance stats) balance-delta),
        delegated-votes: (+ (get delegated-votes stats) delegated-delta),
        proposals-created: (+ (get proposals-created stats) proposals-delta),
        votes-cast: (+ (get votes-cast stats) votes-delta)
      }
    )
  )
)

;; Read-only Functions

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals { proposal-id: proposal-id })
)

(define-read-only (get-proposal-state (proposal-id uint))
  (match (map-get? proposals { proposal-id: proposal-id })
    proposal
      (if (> block-height (get end-block proposal))
        (if (is-proposal-succeeded proposal-id)
          (ok PROPOSAL-STATE-SUCCEEDED)
          (ok PROPOSAL-STATE-DEFEATED)
        )
        (ok (get state proposal))
      )
    ERR-PROPOSAL-NOT-FOUND
  )
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (has-voted (proposal-id uint) (voter principal))
  (is-some (map-get? votes { proposal-id: proposal-id, voter: voter }))
)

(define-private (get-voting-power (user principal) (block uint))
  ;; In production, would check snapshot at block height
  ;; For now, return a placeholder
  u100
)

(define-read-only (get-voting-power-readonly (user principal) (block uint))
  (get-voting-power user block)
)

(define-read-only (get-delegate (delegator principal))
  (map-get? delegations { delegator: delegator })
)

(define-read-only (get-holder-stats (holder principal))
  (map-get? governance-token-holders { holder: holder })
)

(define-read-only (get-vote-receipt (receipt-id uint))
  (map-get? vote-receipts { receipt-id: receipt-id })
)

(define-read-only (get-governance-params)
  (ok {
    voting-period: (var-get voting-period),
    voting-delay: (var-get voting-delay),
    proposal-threshold: (var-get proposal-threshold),
    quorum-percentage: (var-get quorum-percentage),
    timelock-delay: (var-get timelock-delay),
    execution-grace-period: (var-get execution-grace-period)
  })
)

;; Admin Functions

(define-public (set-voting-period (period uint))
  (begin
    (asserts! (is-guardian tx-sender) ERR-UNAUTHORIZED)
    (var-set voting-period period)
    (print { event: "voting-period-updated", period: period })
    (ok true)
  )
)

(define-public (set-voting-delay (delay uint))
  (begin
    (asserts! (is-guardian tx-sender) ERR-UNAUTHORIZED)
    (var-set voting-delay delay)
    (print { event: "voting-delay-updated", delay: delay })
    (ok true)
  )
)

(define-public (set-proposal-threshold (threshold uint))
  (begin
    (asserts! (is-guardian tx-sender) ERR-UNAUTHORIZED)
    (var-set proposal-threshold threshold)
    (print { event: "proposal-threshold-updated", threshold: threshold })
    (ok true)
  )
)

(define-public (set-quorum-percentage (percentage uint))
  (begin
    (asserts! (is-guardian tx-sender) ERR-UNAUTHORIZED)
    (asserts! (<= percentage u10000) ERR-UNAUTHORIZED) ;; Max 100%
    (var-set quorum-percentage percentage)
    (print { event: "quorum-percentage-updated", percentage: percentage })
    (ok true)
  )
)

(define-public (set-timelock-delay (delay uint))
  (begin
    (asserts! (is-guardian tx-sender) ERR-UNAUTHORIZED)
    (var-set timelock-delay delay)
    (print { event: "timelock-delay-updated", delay: delay })
    (ok true)
  )
)

(define-public (add-guardian (guardian principal))
  (begin
    (asserts! (is-guardian tx-sender) ERR-UNAUTHORIZED)
    (map-set guardians guardian true)
    (print { event: "guardian-added", guardian: guardian })
    (ok true)
  )
)

(define-public (remove-guardian (guardian principal))
  (begin
    (asserts! (is-guardian tx-sender) ERR-UNAUTHORIZED)
    (asserts! (not (is-eq guardian CONTRACT-OWNER)) ERR-UNAUTHORIZED)
    (map-set guardians guardian false)
    (print { event: "guardian-removed", guardian: guardian })
    (ok true)
  )
)

(define-read-only (is-guardian (address principal))
  (default-to false (map-get? guardians address))
)
