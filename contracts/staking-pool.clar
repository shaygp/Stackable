;; Staking Pool Contract
;; Allows users to stake tokens and earn rewards over time

;; Constants
(define-constant ERR-UNAUTHORIZED (err u6000))
(define-constant ERR-INSUFFICIENT-BALANCE (err u6001))
(define-constant ERR-INVALID-AMOUNT (err u6002))
(define-constant ERR-NO-STAKE (err u6003))
(define-constant ERR-COOLDOWN-ACTIVE (err u6004))
(define-constant ERR-NOT-INITIALIZED (err u6005))

;; Data variables
(define-data-var contract-owner (optional principal) none)
(define-data-var total-staked uint u0)
(define-data-var reward-rate uint u100)
(define-data-var cooldown-period uint u144)
(define-data-var min-stake-amount uint u1000)

;; Stake tracking
(define-map stakes
  { staker: principal }
  {
    amount: uint,
    staked-at: uint,
    last-claim: uint,
    unstake-requested-at: (optional uint)
  }
)

;; Reward tracking
(define-map accumulated-rewards
  { staker: principal }
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

;; Stake tokens
(define-public (stake (amount uint))
  (let (
    (staker tx-sender)
    (existing-stake (default-to
      { amount: u0, staked-at: u0, last-claim: u0, unstake-requested-at: none }
      (map-get? stakes { staker: staker })))
    (current-amount (get amount existing-stake))
  )
    (asserts! (>= amount (var-get min-stake-amount)) ERR-INVALID-AMOUNT)

    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))

    (map-set stakes
      { staker: staker }
      {
        amount: (+ current-amount amount),
        staked-at: (if (is-eq current-amount u0) block-height (get staked-at existing-stake)),
        last-claim: block-height,
        unstake-requested-at: none
      }
    )

    (var-set total-staked (+ (var-get total-staked) amount))

    (print {
      event: "stake",
      staker: staker,
      amount: amount,
      total: (+ current-amount amount),
      block: block-height
    })

    (ok true)
  )
)

;; Request unstake
(define-public (request-unstake)
  (let (
    (staker tx-sender)
    (stake-info (unwrap! (map-get? stakes { staker: staker }) ERR-NO-STAKE))
  )
    (asserts! (> (get amount stake-info) u0) ERR-NO-STAKE)

    (try! (claim-rewards))

    (map-set stakes
      { staker: staker }
      (merge stake-info { unstake-requested-at: (some block-height) })
    )

    (print {
      event: "unstake-requested",
      staker: staker,
      block: block-height
    })

    (ok true)
  )
)

;; Complete unstake after cooldown
(define-public (complete-unstake)
  (let (
    (staker tx-sender)
    (stake-info (unwrap! (map-get? stakes { staker: staker }) ERR-NO-STAKE))
    (unstake-time (unwrap! (get unstake-requested-at stake-info) ERR-NO-STAKE))
    (amount (get amount stake-info))
  )
    (asserts! (>= block-height (+ unstake-time (var-get cooldown-period))) ERR-COOLDOWN-ACTIVE)

    (try! (as-contract (stx-transfer? amount (as-contract tx-sender) staker)))

    (map-delete stakes { staker: staker })
    (var-set total-staked (- (var-get total-staked) amount))

    (print {
      event: "unstake-completed",
      staker: staker,
      amount: amount,
      block: block-height
    })

    (ok amount)
  )
)

;; Claim rewards
(define-public (claim-rewards)
  (let (
    (staker tx-sender)
    (stake-info (unwrap! (map-get? stakes { staker: staker }) ERR-NO-STAKE))
    (rewards (calculate-rewards staker))
  )
    (if (> rewards u0)
      (begin
        (try! (as-contract (stx-transfer? rewards (as-contract tx-sender) staker)))

        (map-set stakes
          { staker: staker }
          (merge stake-info { last-claim: block-height })
        )

        (map-set accumulated-rewards
          { staker: staker }
          { amount: (+ (get-total-rewards staker) rewards) }
        )

        (print {
          event: "rewards-claimed",
          staker: staker,
          amount: rewards,
          block: block-height
        })

        (ok rewards)
      )
      (ok u0)
    )
  )
)

;; Calculate pending rewards
(define-private (calculate-rewards (staker principal))
  (match (map-get? stakes { staker: staker })
    stake-info
      (let (
        (staked-amount (get amount stake-info))
        (last-claim (get last-claim stake-info))
        (blocks-elapsed (- block-height last-claim))
      )
        (/ (* staked-amount blocks-elapsed (var-get reward-rate)) u10000)
      )
    u0
  )
)

;; Read-only functions
(define-read-only (get-stake (staker principal))
  (map-get? stakes { staker: staker })
)

(define-read-only (get-pending-rewards (staker principal))
  (ok (calculate-rewards staker))
)

(define-read-only (get-total-rewards (staker principal))
  (default-to u0
    (get amount (map-get? accumulated-rewards { staker: staker }))
  )
)

(define-read-only (get-total-staked)
  (ok (var-get total-staked))
)

(define-read-only (get-reward-rate)
  (ok (var-get reward-rate))
)

;; Admin functions
(define-public (set-reward-rate (new-rate uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set reward-rate new-rate)
    (ok true)
  )
)

(define-public (set-cooldown-period (blocks uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set cooldown-period blocks)
    (ok true)
  )
)

(define-public (set-min-stake (amount uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set min-stake-amount amount)
    (ok true)
  )
)

(define-read-only (is-admin (address principal))
  (default-to false (map-get? admins address))
)
