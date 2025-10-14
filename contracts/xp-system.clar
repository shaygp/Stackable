;; XP System Contract for Stacks
;; Gamification layer with experience points, levels, achievements, and quest system

;; Constants

;; Level thresholds (XP required for each level)
(define-constant LEVEL-1-XP u0)
(define-constant LEVEL-2-XP u100)
(define-constant LEVEL-3-XP u300)
(define-constant LEVEL-4-XP u600)
(define-constant LEVEL-5-XP u1000)
(define-constant LEVEL-6-XP u1500)
(define-constant LEVEL-7-XP u2100)
(define-constant LEVEL-8-XP u2800)
(define-constant LEVEL-9-XP u3600)
(define-constant LEVEL-10-XP u5000)

;; Quest types
(define-constant QUEST-TRADE u0)
(define-constant QUEST-LAUNCH u1)
(define-constant QUEST-HOLD u2)
(define-constant QUEST-SOCIAL u3)
(define-constant QUEST-MILESTONE u4)

;; Error codes
(define-constant ERR-UNAUTHORIZED (err u3000))
(define-constant ERR-USER-NOT-FOUND (err u3001))
(define-constant ERR-QUEST-NOT-FOUND (err u3002))
(define-constant ERR-QUEST-ALREADY-COMPLETED (err u3003))
(define-constant ERR-ACHIEVEMENT-NOT-FOUND (err u3004))
(define-constant ERR-ACHIEVEMENT-ALREADY-UNLOCKED (err u3005))
(define-constant ERR-INSUFFICIENT-XP (err u3006))
(define-constant ERR-INVALID-AMOUNT (err u3007))
(define-constant ERR-QUEST-EXPIRED (err u3008))
(define-constant ERR-REQUIREMENTS-NOT-MET (err u3009))
(define-constant ERR-PAUSED (err u3010))
(define-constant ERR-NOT-INITIALIZED (err u3011))

;; Data structures

;; User XP and stats
(define-map user-xp
  { user: principal }
  {
    total-xp: uint,
    level: uint,
    lifetime-xp: uint,
    last-activity: uint,
    streak-days: uint,
    last-streak-update: uint
  }
)

;; Quest definitions
(define-map quests
  { quest-id: (string-ascii 64) }
  {
    name: (string-utf8 256),
    description: (string-utf8 512),
    quest-type: uint,
    xp-reward: uint,
    requirements: uint,
    expiry-block: (optional uint),
    active: bool,
    created-by: principal,
    created-at: uint
  }
)

;; User quest completions
(define-map quest-completions
  { user: principal, quest-id: (string-ascii 64) }
  {
    completed: bool,
    completed-at: uint,
    progress: uint,
    claimed: bool
  }
)

;; Achievement definitions
(define-map achievements
  { achievement-id: (string-ascii 64) }
  {
    name: (string-utf8 256),
    description: (string-utf8 512),
    xp-reward: uint,
    icon-uri: (optional (string-utf8 256)),
    rarity: uint,
    requirements: (list 5 uint),
    active: bool
  }
)

;; User achievement unlocks
(define-map user-achievements
  { user: principal, achievement-id: (string-ascii 64) }
  {
    unlocked: bool,
    unlocked-at: uint,
    progress: uint
  }
)

;; Leaderboard tracking
(define-map leaderboard-entries
  { user: principal }
  {
    rank: uint,
    xp: uint,
    last-updated: uint
  }
)

;; XP multipliers for special events
(define-map xp-multipliers
  { user: principal }
  {
    multiplier: uint,
    expires-at: uint
  }
)

;; Referral system
(define-map referrals
  { referrer: principal, referee: principal }
  {
    referral-xp-earned: uint,
    created-at: uint
  }
)

(define-map referral-counts principal uint)

;; Global settings
(define-data-var contract-paused bool false)
(define-data-var base-xp-multiplier uint u100)
(define-data-var referral-bonus-xp uint u50)
(define-data-var daily-streak-bonus uint u10)
(define-data-var contract-owner (optional principal) none)

;; Admin management
(define-map admins principal bool)
(define-map quest-creators principal bool)

;; Initialize the contract
(define-public (initialize (owner principal))
  (begin
    (asserts! (is-none (var-get contract-owner)) ERR-UNAUTHORIZED)
    (var-set contract-owner (some owner))
    (map-set admins owner true)
    (map-set quest-creators owner true)
    (ok true)
  )
)

;; Core XP Functions

;; Add XP to a user
(define-public (add-xp (user principal) (xp uint) (reason (string-utf8 256)))
  (let (
    (user-data (default-to
      { total-xp: u0, level: u1, lifetime-xp: u0, last-activity: u0, streak-days: u0, last-streak-update: u0 }
      (map-get? user-xp { user: user })))
    (multiplier (get-active-multiplier user))
    (effective-xp (* xp multiplier))
    (new-total-xp (+ (get total-xp user-data) effective-xp))
    (new-level (calculate-level new-total-xp))
    (old-level (get level user-data))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (> xp u0) ERR-INVALID-AMOUNT)

    ;; Update user XP
    (map-set user-xp
      { user: user }
      {
        total-xp: new-total-xp,
        level: new-level,
        lifetime-xp: (+ (get lifetime-xp user-data) effective-xp),
        last-activity: block-height,
        streak-days: (get streak-days user-data),
        last-streak-update: (get last-streak-update user-data)
      }
    )

    ;; Update leaderboard
    (update-leaderboard user new-total-xp)

    (print {
      event: "xp-added",
      user: user,
      xp: xp,
      effective-xp: effective-xp,
      multiplier: multiplier,
      new-total: new-total-xp,
      new-level: new-level,
      leveled-up: (> new-level old-level),
      reason: reason,
      block: block-height
    })

    (ok { xp-added: effective-xp, new-level: new-level, leveled-up: (> new-level old-level) })
  )
)

;; Remove XP (admin only, for corrections)
(define-public (remove-xp (user principal) (xp uint))
  (let (
    (user-data (unwrap! (map-get? user-xp { user: user }) ERR-USER-NOT-FOUND))
    (current-xp (get total-xp user-data))
    (new-xp (if (>= current-xp xp) (- current-xp xp) u0))
    (new-level (calculate-level new-xp))
  )
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)

    (map-set user-xp
      { user: user }
      (merge user-data {
        total-xp: new-xp,
        level: new-level
      })
    )

    (print {
      event: "xp-removed",
      user: user,
      xp-removed: xp,
      new-total: new-xp,
      new-level: new-level
    })

    (ok true)
  )
)

;; Update daily streak
(define-public (update-streak)
  (let (
    (user-data (default-to
      { total-xp: u0, level: u1, lifetime-xp: u0, last-activity: u0, streak-days: u0, last-streak-update: u0 }
      (map-get? user-xp { user: tx-sender })))
    (last-update (get last-streak-update user-data))
    (blocks-since-update (- block-height last-update))
    (days-since-update (/ blocks-since-update u144)) ;; ~144 blocks per day on Stacks
  )
    (if (and (> blocks-since-update u144) (<= blocks-since-update u288))
      ;; Consecutive day
      (let ((new-streak (+ (get streak-days user-data) u1)))
        (map-set user-xp
          { user: tx-sender }
          (merge user-data {
            streak-days: new-streak,
            last-streak-update: block-height
          })
        )
        (try! (add-xp tx-sender (* new-streak (var-get daily-streak-bonus)) u"Daily streak bonus"))
        (ok { streak: new-streak, bonus-applied: true })
      )
      (if (> blocks-since-update u288)
        ;; Streak broken
        (begin
          (map-set user-xp
            { user: tx-sender }
            (merge user-data {
              streak-days: u1,
              last-streak-update: block-height
            })
          )
          (ok { streak: u1, bonus-applied: false })
        )
        ;; Same day
        (ok { streak: (get streak-days user-data), bonus-applied: false })
      )
    )
  )
)

;; Quest System

;; Create a new quest
(define-public (create-quest
  (quest-id (string-ascii 64))
  (name (string-utf8 256))
  (description (string-utf8 512))
  (quest-type uint)
  (xp-reward uint)
  (requirements uint)
  (expiry-block (optional uint)))
  (begin
    (asserts! (is-quest-creator tx-sender) ERR-UNAUTHORIZED)
    (asserts! (is-none (map-get? quests { quest-id: quest-id })) ERR-QUEST-ALREADY-COMPLETED)

    (ok (map-set quests
      { quest-id: quest-id }
      {
        name: name,
        description: description,
        quest-type: quest-type,
        xp-reward: xp-reward,
        requirements: requirements,
        expiry-block: expiry-block,
        active: true,
        created-by: tx-sender,
        created-at: block-height
      }
    ))
  )
)

;; Complete a quest
(define-public (complete-quest (quest-id (string-ascii 64)) (progress-amount uint))
  (let (
    (quest (unwrap! (map-get? quests { quest-id: quest-id }) ERR-QUEST-NOT-FOUND))
    (existing-completion (map-get? quest-completions { user: tx-sender, quest-id: quest-id }))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (get active quest) ERR-QUEST-NOT-FOUND)

    ;; Check expiry
    (match (get expiry-block quest)
      expiry (asserts! (<= block-height expiry) ERR-QUEST-EXPIRED)
      true
    )

    ;; Check if already completed
    (match existing-completion
      completion (asserts! (not (get completed completion)) ERR-QUEST-ALREADY-COMPLETED)
      true
    )

    (let ((current-progress (match existing-completion
      completion (get progress completion)
      u0)))

      (let ((new-progress (+ current-progress progress-amount)))
        (if (>= new-progress (get requirements quest))
          ;; Quest completed
          (begin
            (map-set quest-completions
              { user: tx-sender, quest-id: quest-id }
              {
                completed: true,
                completed-at: block-height,
                progress: new-progress,
                claimed: false
              }
            )
            (try! (add-xp tx-sender (get xp-reward quest) u"Quest completed"))
            (print {
              event: "quest-completed",
              user: tx-sender,
              quest-id: quest-id,
              xp-reward: (get xp-reward quest),
              block: block-height
            })
            (ok { completed: true, progress: new-progress, xp-earned: (get xp-reward quest) })
          )
          ;; Progress updated
          (begin
            (map-set quest-completions
              { user: tx-sender, quest-id: quest-id }
              {
                completed: false,
                completed-at: u0,
                progress: new-progress,
                claimed: false
              }
            )
            (ok { completed: false, progress: new-progress, xp-earned: u0 })
          )
        )
      )
    )
  )
)

;; Achievement System

;; Create an achievement
(define-public (create-achievement
  (achievement-id (string-ascii 64))
  (name (string-utf8 256))
  (description (string-utf8 512))
  (xp-reward uint)
  (icon-uri (optional (string-utf8 256)))
  (rarity uint)
  (requirements (list 5 uint)))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (asserts! (is-none (map-get? achievements { achievement-id: achievement-id })) ERR-ACHIEVEMENT-ALREADY-UNLOCKED)

    (ok (map-set achievements
      { achievement-id: achievement-id }
      {
        name: name,
        description: description,
        xp-reward: xp-reward,
        icon-uri: icon-uri,
        rarity: rarity,
        requirements: requirements,
        active: true
      }
    ))
  )
)

;; Unlock an achievement
(define-public (unlock-achievement (achievement-id (string-ascii 64)))
  (let (
    (achievement (unwrap! (map-get? achievements { achievement-id: achievement-id }) ERR-ACHIEVEMENT-NOT-FOUND))
    (existing-unlock (map-get? user-achievements { user: tx-sender, achievement-id: achievement-id }))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (get active achievement) ERR-ACHIEVEMENT-NOT-FOUND)

    ;; Check if already unlocked
    (match existing-unlock
      unlock (asserts! (not (get unlocked unlock)) ERR-ACHIEVEMENT-ALREADY-UNLOCKED)
      true
    )

    (map-set user-achievements
      { user: tx-sender, achievement-id: achievement-id }
      {
        unlocked: true,
        unlocked-at: block-height,
        progress: u100
      }
    )

    (try! (add-xp tx-sender (get xp-reward achievement) u"Achievement unlocked"))

    (print {
      event: "achievement-unlocked",
      user: tx-sender,
      achievement-id: achievement-id,
      xp-reward: (get xp-reward achievement),
      block: block-height
    })

    (ok true)
  )
)

;; Referral System

;; Record a referral
(define-public (record-referral (referee principal))
  (let ((existing (map-get? referrals { referrer: tx-sender, referee: referee })))
    (asserts! (not (is-eq tx-sender referee)) ERR-UNAUTHORIZED)
    (asserts! (is-none existing) ERR-QUEST-ALREADY-COMPLETED)

    (map-set referrals
      { referrer: tx-sender, referee: referee }
      {
        referral-xp-earned: u0,
        created-at: block-height
      }
    )

    (let ((count (default-to u0 (map-get? referral-counts tx-sender))))
      (map-set referral-counts tx-sender (+ count u1))
    )

    ;; Give bonus to referrer
    (try! (add-xp tx-sender (var-get referral-bonus-xp) u"Referral bonus"))

    (print {
      event: "referral-recorded",
      referrer: tx-sender,
      referee: referee,
      bonus-xp: (var-get referral-bonus-xp)
    })

    (ok true)
  )
)

;; Helper Functions

(define-private (calculate-level (xp uint))
  (if (< xp LEVEL-2-XP) u1
    (if (< xp LEVEL-3-XP) u2
      (if (< xp LEVEL-4-XP) u3
        (if (< xp LEVEL-5-XP) u4
          (if (< xp LEVEL-6-XP) u5
            (if (< xp LEVEL-7-XP) u6
              (if (< xp LEVEL-8-XP) u7
                (if (< xp LEVEL-9-XP) u8
                  (if (< xp LEVEL-10-XP) u9
                    u10
                  )
                )
              )
            )
          )
        )
      )
    )
  )
)

(define-private (get-active-multiplier (user principal))
  (match (map-get? xp-multipliers { user: user })
    multiplier-data
      (if (>= block-height (get expires-at multiplier-data))
        (/ (var-get base-xp-multiplier) u100)
        (/ (get multiplier multiplier-data) u100)
      )
    (/ (var-get base-xp-multiplier) u100)
  )
)

(define-private (update-leaderboard (user principal) (xp uint))
  (map-set leaderboard-entries
    { user: user }
    {
      rank: u0, ;; Would be calculated by backend
      xp: xp,
      last-updated: block-height
    }
  )
)

;; Read-only Functions

(define-read-only (get-xp (user principal))
  (default-to u0 (get total-xp (default-to
    { total-xp: u0, level: u1, lifetime-xp: u0, last-activity: u0, streak-days: u0, last-streak-update: u0 }
    (map-get? user-xp { user: user }))))
)

(define-read-only (get-user-stats (user principal))
  (map-get? user-xp { user: user })
)

(define-read-only (get-level (user principal))
  (default-to u1 (get level (default-to
    { total-xp: u0, level: u1, lifetime-xp: u0, last-activity: u0, streak-days: u0, last-streak-update: u0 }
    (map-get? user-xp { user: user }))))
)

(define-read-only (xp-to-next-level (user principal))
  (let (
    (current-level (get-level user))
    (current-xp (get-xp user))
  )
    (if (is-eq current-level u1) (ok (- LEVEL-2-XP current-xp))
      (if (is-eq current-level u2) (ok (- LEVEL-3-XP current-xp))
        (if (is-eq current-level u3) (ok (- LEVEL-4-XP current-xp))
          (if (is-eq current-level u4) (ok (- LEVEL-5-XP current-xp))
            (if (is-eq current-level u5) (ok (- LEVEL-6-XP current-xp))
              (if (is-eq current-level u6) (ok (- LEVEL-7-XP current-xp))
                (if (is-eq current-level u7) (ok (- LEVEL-8-XP current-xp))
                  (if (is-eq current-level u8) (ok (- LEVEL-9-XP current-xp))
                    (if (is-eq current-level u9) (ok (- LEVEL-10-XP current-xp))
                      (ok u0) ;; Max level
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  )
)

(define-read-only (get-quest (quest-id (string-ascii 64)))
  (map-get? quests { quest-id: quest-id })
)

(define-read-only (get-quest-progress (user principal) (quest-id (string-ascii 64)))
  (map-get? quest-completions { user: user, quest-id: quest-id })
)

(define-read-only (quest-completed (user principal) (quest-id (string-ascii 64)))
  (match (map-get? quest-completions { user: user, quest-id: quest-id })
    completion (get completed completion)
    false
  )
)

(define-read-only (get-achievement (achievement-id (string-ascii 64)))
  (map-get? achievements { achievement-id: achievement-id })
)

(define-read-only (achievement-unlocked (user principal) (achievement-id (string-ascii 64)))
  (match (map-get? user-achievements { user: user, achievement-id: achievement-id })
    unlock (get unlocked unlock)
    false
  )
)

(define-read-only (get-leaderboard-entry (user principal))
  (map-get? leaderboard-entries { user: user })
)

(define-read-only (get-referral-count (user principal))
  (default-to u0 (map-get? referral-counts user))
)

(define-read-only (get-streak (user principal))
  (match (map-get? user-xp { user: user })
    data (ok (get streak-days data))
    (ok u0)
  )
)

;; Admin Functions

(define-public (set-xp-multiplier (user principal) (multiplier uint) (duration-blocks uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set xp-multipliers
      { user: user }
      {
        multiplier: multiplier,
        expires-at: (+ block-height duration-blocks)
      }
    )
    (print { event: "xp-multiplier-set", user: user, multiplier: multiplier, expires-at: (+ block-height duration-blocks) })
    (ok true)
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

(define-public (set-referral-bonus (bonus uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set referral-bonus-xp bonus)
    (print { event: "referral-bonus-updated", bonus: bonus })
    (ok true)
  )
)

(define-public (set-daily-streak-bonus (bonus uint))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (var-set daily-streak-bonus bonus)
    (print { event: "daily-streak-bonus-updated", bonus: bonus })
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

(define-public (add-quest-creator (creator principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set quest-creators creator true)
    (print { event: "quest-creator-added", creator: creator })
    (ok true)
  )
)

(define-public (remove-quest-creator (creator principal))
  (begin
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (map-set quest-creators creator false)
    (print { event: "quest-creator-removed", creator: creator })
    (ok true)
  )
)

(define-public (deactivate-quest (quest-id (string-ascii 64)))
  (let ((quest (unwrap! (map-get? quests { quest-id: quest-id }) ERR-QUEST-NOT-FOUND)))
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (ok (map-set quests
      { quest-id: quest-id }
      (merge quest { active: false })
    ))
  )
)

(define-public (deactivate-achievement (achievement-id (string-ascii 64)))
  (let ((achievement (unwrap! (map-get? achievements { achievement-id: achievement-id }) ERR-ACHIEVEMENT-NOT-FOUND)))
    (asserts! (is-admin tx-sender) ERR-UNAUTHORIZED)
    (ok (map-set achievements
      { achievement-id: achievement-id }
      (merge achievement { active: false })
    ))
  )
)

(define-read-only (is-admin (address principal))
  (default-to false (map-get? admins address))
)

(define-read-only (is-quest-creator (address principal))
  (default-to false (map-get? quest-creators address))
)

(define-read-only (is-paused)
  (var-get contract-paused))
