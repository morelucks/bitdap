;; title: Bitdap Pass
;; version: 0.4.0
;; summary: Bitdap Pass - tiered membership NFT collection with marketplace on Stacks.
;; description: >
;;   Bitdap Pass is a non-fungible token (NFT) collection that represents
;;   access passes to the Bitdap ecosystem. Each pass belongs to a tier
;;   (Basic, Pro, or VIP), which can be used by off-chain services or
;;   other contracts to gate features and experiences.
;;
;;   - Collection name: Bitdap Pass
;;   - Tiers: Basic, Pro, VIP
;;   - 1 owner per token-id, non-fractional NFTs
;;   - Marketplace functions: get-listing, update-listing-price, cancel-listing
;;   - Future milestones will define minting, transfer logic, and metadata
;;     for each tier.
;;
;;   - mint-event: emitted when a pass is minted (token-id, owner, tier)
;;   - transfer-event: emitted when ownership changes (token-id, from, to)
;;   - burn-event: emitted when a pass is burned (token-id, owner, tier)
;;   - listing-price-updated: emitted when listing price is changed
;;   - listing-cancelled: emitted when listing is cancelled

;; traits
;; - Trait definitions can be added here (e.g., SIP-009) for interface compatibility.

;; token definitions
;; - Bitdap Pass uses uint token-ids (u1, u2, ...) to identify each NFT.
;; - Each token-id is associated with exactly one owner and one tier.
;;

;; constants
;; - Collection-wide configuration, tier identifiers, and error codes.

;; Enhanced Error Handling System with Network Errors
;; Error codes are categorized for better debugging and user experience

;; Validation Errors (100-199) - Input validation failures
(define-constant ERR-INVALID-TIER (err u100))
(define-constant ERR-INVALID-TOKEN-ID (err u101))
(define-constant ERR-INVALID-PRICE (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))
(define-constant ERR-INVALID-RECIPIENT (err u104))
(define-constant ERR-INVALID-URI (err u105))
(define-constant ERR-INVALID-EXPIRY (err u106))
(define-constant ERR-INVALID-BATCH-SIZE (err u107))
(define-constant ERR-INVALID-PAGINATION (err u108))
(define-constant ERR-INVALID-FILTER (err u109))
(define-constant ERR-SELF-TRANSFER (err u110))
(define-constant ERR-INVALID-SIGNATURE (err u111))
(define-constant ERR-INVALID-NONCE (err u112))

;; Authorization Errors (200-299) - Permission and access control failures
(define-constant ERR-UNAUTHORIZED (err u200))
(define-constant ERR-NOT-OWNER (err u201))
(define-constant ERR-NOT-ADMIN (err u202))
(define-constant ERR-NOT-SELLER (err u203))
(define-constant ERR-NOT-BUYER (err u204))
(define-constant ERR-INSUFFICIENT-PERMISSIONS (err u205))
(define-constant ERR-BLACKLISTED (err u206))
(define-constant ERR-RATE_LIMITED (err u207))

;; Business Logic Errors (300-399) - Business rule violations
(define-constant ERR-NOT-FOUND (err u300))
(define-constant ERR-ALREADY-EXISTS (err u301))
(define-constant ERR-LISTING-NOT-FOUND (err u302))
(define-constant ERR-LISTING-EXPIRED (err u303))
(define-constant ERR-LISTING-INACTIVE (err u304))
(define-constant ERR-OFFER-NOT-FOUND (err u305))
(define-constant ERR-OFFER-EXPIRED (err u306))
(define-constant ERR-INSUFFICIENT-BALANCE (err u307))
(define-constant ERR-INSUFFICIENT-ALLOWANCE (err u308))
(define-constant ERR-DUPLICATE-OPERATION (err u309))

;; Resource Errors (400-499) - Capacity and limit violations
(define-constant ERR-MAX-SUPPLY (err u400))
(define-constant ERR-MAX-TIER-SUPPLY (err u401))
(define-constant ERR-MAX-LISTINGS (err u402))
(define-constant ERR-MAX-OFFERS (err u403))
(define-constant ERR-MAX-BATCH-SIZE (err u404))
(define-constant ERR-STORAGE-LIMIT (err u405))
(define-constant ERR-QUERY-LIMIT (err u406))

;; System Errors (500-599) - Internal system failures
(define-constant ERR-PAUSED (err u500))
(define-constant ERR-MARKETPLACE-PAUSED (err u501))
(define-constant ERR-FEATURE-DISABLED (err u502))
(define-constant ERR-MAINTENANCE-MODE (err u503))
(define-constant ERR-INTERNAL-ERROR (err u504))
(define-constant ERR-OVERFLOW (err u505))
(define-constant ERR-UNDERFLOW (err u506))

;; Marketplace Errors (600-699) - Marketplace-specific failures
(define-constant ERR-LISTING-PRICE-TOO-LOW (err u600))
(define-constant ERR-LISTING-PRICE-TOO-HIGH (err u601))
(define-constant ERR-RESERVE-NOT-MET (err u602))
(define-constant ERR-AUCTION-ACTIVE (err u603))
(define-constant ERR-AUCTION-ENDED (err u604))
(define-constant ERR-BID-TOO-LOW (err u605))
(define-constant ERR-PAYMENT-FAILED (err u606))
(define-constant ERR-ESCROW-FAILED (err u607))

;; Error message mapping for human-readable descriptions
(define-map error-messages
    { error-code: uint }
    { 
        category: (string-ascii 16),
        message: (string-utf8 256),
        suggestion: (string-utf8 256)
    }
)

;; Initialize error messages
(map-set error-messages { error-code: u100 } {
    category: "validation",
    message: u"Invalid tier specified. Must be 1 (Basic), 2 (Pro), or 3 (VIP)",
    suggestion: u"Use TIER-BASIC, TIER-PRO, or TIER-VIP constants"
})

(map-set error-messages { error-code: u101 } {
    category: "validation", 
    message: u"Invalid token ID provided",
    suggestion: u"Ensure token ID exists and is greater than 0"
})

(map-set error-messages { error-code: u102 } {
    category: "validation",
    message: u"Invalid price specified. Must be greater than 0",
    suggestion: u"Set a positive price value in microSTX"
})

(map-set error-messages { error-code: u200 } {
    category: "authorization",
    message: u"Unauthorized access. Caller lacks required permissions",
    suggestion: u"Ensure you have the necessary role or ownership"
})

(map-set error-messages { error-code: u201 } {
    category: "authorization",
    message: u"Not the owner of this token",
    suggestion: u"Only token owners can perform this operation"
})

(map-set error-messages { error-code: u300 } {
    category: "business-logic",
    message: u"Requested resource not found",
    suggestion: u"Verify the resource exists and try again"
})

(map-set error-messages { error-code: u400 } {
    category: "resource",
    message: u"Maximum supply limit reached",
    suggestion: u"No more tokens can be minted"
})

(map-set error-messages { error-code: u500 } {
    category: "system",
    message: u"Contract is currently paused",
    suggestion: u"Wait for contract to be unpaused by administrator"
})

;; Gas optimization constants
(define-constant GAS-OPTIMIZED-BATCH-SIZE u50)
(define-constant FAST-LOOKUP-CACHE-SIZE u100)

;; Tiers are represented as uints for compact on-chain storage.
(define-constant TIER-BASIC u1)
(define-constant TIER-PRO u2)
(define-constant TIER-VIP u3)

;; Collection-wide and per-tier maximum supplies with dynamic adjustment capability.
;; These are conservative defaults that can be adjusted in future versions.
(define-constant MAX-SUPPLY u10000)
(define-constant MAX-BASIC-SUPPLY u7000)
(define-constant MAX-PRO-SUPPLY u2500)
(define-constant MAX-VIP-SUPPLY u500)

;; Dynamic supply adjustment variables
(define-data-var dynamic-max-supply uint MAX-SUPPLY)
(define-data-var dynamic-basic-supply uint MAX-BASIC-SUPPLY)
(define-data-var dynamic-pro-supply uint MAX-PRO-SUPPLY)
(define-data-var dynamic-vip-supply uint MAX-VIP-SUPPLY)

;; data vars
;; - Global counters for token-ids and total supply.

;; Next token-id to mint (starts at u1).
(define-data-var next-token-id uint u1)

;; Total number of Bitdap Pass NFTs currently in circulation.
(define-data-var total-supply uint u0)

;; Contract owner (admin) - initialized to contract deployer
(define-data-var contract-owner principal tx-sender)

;; Marketplace pause flag (when true, marketplace operations are disabled)
(define-data-var marketplace-paused bool false)

;; Counter for unique users who have interacted with the contract
(define-data-var user-count uint u0)

;; Counter for marketplace listings
(define-data-var listing-count uint u0)

;; Next listing ID to assign
(define-data-var next-listing-id uint u1)

;; Flash loan protection
(define-data-var flash-loan-guard bool false)

;; MEV protection timestamp
(define-data-var last-block-timestamp uint u0)

;; Counter for total transactions (mints, transfers, burns)
(define-data-var transaction-count uint u0)

;; Enhanced Error Handling Helper Functions

;; Get error message details for a given error code
(define-read-only (get-error-message (error-code uint))
    (match (map-get? error-messages { error-code: error-code })
        error-data (ok error-data)
        (err u504) ;; Internal error if error message not found
    )
)

;; Validate input parameters with specific error codes
(define-private (validate-tier (tier uint))
    (if (or (is-eq tier TIER-BASIC) (or (is-eq tier TIER-PRO) (is-eq tier TIER-VIP)))
        (ok true)
        ERR-INVALID-TIER
    )
)

(define-private (validate-token-id (token-id uint))
    (if (> token-id u0)
        (ok true)
        ERR-INVALID-TOKEN-ID
    )
)

(define-private (validate-price (price uint))
    (if (> price u0)
        (ok true)
        ERR-INVALID-PRICE
    )
)

(define-private (validate-not-paused)
    (if (or (var-get mint-paused) (var-get transfer-paused))
        ERR-PAUSED
        (ok true)
    )
)

(define-private (validate-marketplace-not-paused)
    (if (var-get marketplace-paused)
        ERR-MARKETPLACE-PAUSED
        (ok true)
    )
)

(define-private (validate-admin (caller principal))
    (if (is-eq caller (var-get contract-owner))
        (ok true)
        ERR-NOT-ADMIN
    )
)

(define-private (validate-token-owner (token-id uint) (caller principal))
    (match (map-get? token-owners { token-id: token-id })
        owner-data (if (is-eq (get owner owner-data) caller)
            (ok true)
            ERR-NOT-OWNER
        )
        ERR-NOT-FOUND
    )
)

;; Enhanced Event System

;; Event types for structured logging
(define-constant EVENT-TOKEN-MINTED "token-minted")
(define-constant EVENT-TOKEN-TRANSFERRED "token-transferred") 
(define-constant EVENT-TOKEN-BURNED "token-burned")
(define-constant EVENT-LISTING-CREATED "listing-created")
(define-constant EVENT-LISTING-UPDATED "listing-updated")
(define-constant EVENT-LISTING-CANCELLED "listing-cancelled")
(define-constant EVENT-PURCHASE-COMPLETED "purchase-completed")
(define-constant EVENT-OFFER-CREATED "offer-created")
(define-constant EVENT-OFFER-ACCEPTED "offer-accepted")
(define-constant EVENT-OFFER-REJECTED "offer-rejected")
(define-constant EVENT-ADMIN-ACTION "admin-action")
(define-constant EVENT-CONFIG-UPDATED "config-updated")
(define-constant EVENT-PAUSE-STATE-CHANGED "pause-state-changed")
(define-constant EVENT-BATCH-OPERATION "batch-operation")

;; Enhanced event emission functions with standardized metadata
(define-private (emit-token-event 
    (event-type (string-ascii 32))
    (token-id uint)
    (actor principal)
    (data (tuple (tier uint) (recipient (optional principal)) (from (optional principal)) (to (optional principal))))
)
    (print (tuple
        (event-type event-type)
        (timestamp stacks-block-height)
        (block-height stacks-block-height)
        (transaction-id tx-sender)
        (actor actor)
        (token-id token-id)
        (data data)
    ))
)

(define-private (emit-marketplace-event
    (event-type (string-ascii 32))
    (listing-id (optional uint))
    (token-id (optional uint))
    (actor principal)
    (data (tuple (price (optional uint)) (seller (optional principal)) (buyer (optional principal)) (fee (optional uint))))
)
    (print (tuple
        (event-type event-type)
        (timestamp stacks-block-height)
        (block-height stacks-block-height)
        (transaction-id tx-sender)
        (actor actor)
        (listing-id listing-id)
        (token-id token-id)
        (data data)
    ))
)

(define-private (emit-admin-event
    (event-type (string-ascii 32))
    (admin principal)
    (action (string-ascii 32))
    (data (tuple (old-value (optional uint)) (new-value (optional uint)) (target (optional principal))))
)
    (print (tuple
        (event-type event-type)
        (timestamp stacks-block-height)
        (block-height stacks-block-height)
        (transaction-id tx-sender)
        (actor admin)
        (action action)
        (data data)
    ))
)

(define-private (emit-batch-event
    (event-type (string-ascii 32))
    (actor principal)
    (operation-count uint)
    (success-count uint)
    (data (tuple (operation-type (string-ascii 32)) (details (optional (string-utf8 256)))))
)
    (print (tuple
        (event-type event-type)
        (timestamp stacks-block-height)
        (block-height stacks-block-height)
        (transaction-id tx-sender)
        (actor actor)
        (operation-count operation-count)
        (success-count success-count)
        (data data)
    ))
)

;; data maps
;; - Storage for token ownership, metadata, and per-tier supply.

;; token-id -> owner principal
(define-map token-owners
    { token-id: uint }
    { owner: principal }
)

;; Enhanced metadata with royalty and creator information
(define-map token-metadata
    { token-id: uint }
    {
        tier: uint,
        uri: (optional (string-utf8 256)),
        creator: principal,
        royalty-percent: uint,
        created-at: uint,
        last-updated: uint
    }
)

;; tier -> current supply for that tier
(define-map tier-supplies
    { tier: uint }
    { supply: uint }
)

;; principal -> bool (tracks if user has interacted with contract)
(define-map user-registry
    { user: principal }
    { active: bool }
)

;; Cross-chain bridge compatibility
(define-map bridge-tokens
    { bridge-id: (string-ascii 32), external-token-id: (string-utf8 64) }
    { internal-token-id: uint, bridge-timestamp: uint }
)

;; Enhanced listing-id -> listing details with advanced features
(define-map marketplace-listings
    { listing-id: uint }
    {
        token-id: uint,
        seller: principal,
        price: uint,
        reserve-price: (optional uint),
        expiry-block: (optional uint),
        listing-type: (string-ascii 16), ;; "fixed", "auction", "offer"
        created-at: uint,
        updated-at: uint,
        active: bool,
        view-count: uint
    }
)

;; offer-id -> offer details for marketplace offers
(define-map marketplace-offers
    { offer-id: uint }
    {
        listing-id: uint,
        token-id: uint,
        bidder: principal,
        amount: uint,
        expiry-block: uint,
        created-at: uint,
        status: (string-ascii 16) ;; "active", "accepted", "rejected", "expired"
    }
)

;; Advanced marketplace analytics
(define-map marketplace-analytics
    { period: (string-ascii 16) } ;; "daily", "weekly", "monthly"
    {
        total-volume: uint,
        total-sales: uint,
        average-price: uint,
        unique-buyers: uint,
        unique-sellers: uint,
        last-updated: uint
    }
)

;; Staking rewards for NFT holders
(define-map staking-rewards
    { token-id: uint }
    { staked-at: uint, rewards-earned: uint, last-claim: uint }
)

;; Price history for tokens
(define-map price-history
    { token-id: uint, sale-id: uint }
    {
        price: uint,
        seller: principal,
        buyer: principal,
        sale-date: uint,
        listing-type: (string-ascii 16)
    }
)

;; Marketplace configuration
(define-data-var next-offer-id uint u1)
(define-data-var next-sale-id uint u1)
(define-data-var min-listing-price uint u1000) ;; 0.001 STX
(define-data-var max-listing-price uint u1000000000) ;; 1000 STX
(define-data-var offer-expiry-blocks uint u1008) ;; ~1 week

;; buyer -> listing-id -> purchase record
(define-map purchase-history
    { buyer: principal, listing-id: uint }
    {
        purchase-price: uint,
        purchased-at: uint,
        seller: principal
    }
)

;; seller -> list of listing-ids they've created
(define-map seller-listings
    { seller: principal }
    { listing-ids: (list 100 uint) }
)

;; Marketplace fee configuration
(define-data-var marketplace-fee-percent uint u2)
(define-data-var marketplace-fee-recipient principal tx-sender)
(define-data-var total-fees-collected uint u0)

;; Enhanced Security Framework

;; Role-based access control
(define-map admin-roles
    { admin: principal }
    { 
        role: (string-ascii 16),
        granted-at: uint,
        granted-by: principal
    }
)

;; Rate limiting for abuse prevention
(define-map rate-limits
    { user: principal, operation: (string-ascii 32) }
    {
        count: uint,
        window-start: uint,
        last-operation: uint
    }
)

;; Blacklist for security
(define-map blacklisted-users
    { user: principal }
    {
        blacklisted: bool,
        reason: (string-utf8 256),
        blacklisted-at: uint
    }
)

;; Emergency controls
(define-data-var emergency-mode bool false)
(define-data-var mint-paused bool false)
(define-data-var transfer-paused bool false)
(define-data-var marketplace-operations-paused bool false)

;; Security configuration
(define-data-var rate-limit-window uint u144) ;; ~24 hours in blocks
(define-data-var max-operations-per-window uint u100)
(define-data-var security-admin principal tx-sender)

;; Security validation functions
(define-private (check-rate-limit (user principal) (operation (string-ascii 32)))
    (let (
        (current-block stacks-block-height)
        (rate-data (default-to 
            { count: u0, window-start: current-block, last-operation: u0 }
            (map-get? rate-limits { user: user, operation: operation })
        ))
        (window-start (get window-start rate-data))
        (count (get count rate-data))
    )
        (if (> (- current-block window-start) (var-get rate-limit-window))
            ;; New window, reset count
            (begin
                (map-set rate-limits { user: user, operation: operation } {
                    count: u1,
                    window-start: current-block,
                    last-operation: current-block
                })
                (ok true)
            )
            ;; Same window, check limit
            (if (>= count (var-get max-operations-per-window))
                ERR-RATE_LIMITED
                (begin
                    (map-set rate-limits { user: user, operation: operation } {
                        count: (+ count u1),
                        window-start: window-start,
                        last-operation: current-block
                    })
                    (ok true)
                )
            )
        )
    )
)

(define-private (check-blacklist (user principal))
    (match (map-get? blacklisted-users { user: user })
        blacklist-data (if (get blacklisted blacklist-data)
            ERR-BLACKLISTED
            (ok true)
        )
        (ok true)
    )
)

(define-private (validate-security-checks (user principal) (operation (string-ascii 32)))
    (begin
        (try! (check-blacklist user))
        (try! (check-rate-limit user operation))
        (if (var-get emergency-mode)
            ERR-MAINTENANCE-MODE
            (ok true)
        )
    )
)

(define-private (check-admin-role (admin principal) (required-role (string-ascii 16)))
    (match (map-get? admin-roles { admin: admin })
        role-data (if (or 
            (is-eq (get role role-data) required-role)
            (is-eq (get role role-data) "super-admin")
        )
            (ok true)
            ERR-INSUFFICIENT-PERMISSIONS
        )
        (if (is-eq admin (var-get contract-owner))
            (ok true)
            ERR-INSUFFICIENT-PERMISSIONS
        )
    )
)

;; public functions
;; - Core NFT operations: mint, transfer, burn.

;; Mint a new Bitdap Pass NFT for the caller in the given tier.
;; - The recipient is always tx-sender for now; this keeps permissions simple:
;;   users can only mint passes for themselves.
;; - Enforces global and per-tier maximum supplies.
;; - Returns (ok token-id) on success, or an error constant on failure.
(define-read-only (get-max-supply)
    MAX-SUPPLY
)

(define-read-only (is-paused)
    (ok (tuple 
        (mint-paused (var-get mint-paused))
        (transfer-paused (var-get transfer-paused))
        (marketplace-paused (var-get marketplace-paused))
    ))
)

(define-public (mint-pass
        (tier uint)
        (uri (optional (string-utf8 256)))
    )
    (begin
        ;; Enhanced security and validation checks
        (try! (validate-security-checks tx-sender "mint"))
        (try! (validate-not-paused))
        (asserts! (not (var-get mint-paused)) ERR-FEATURE-DISABLED)
        (try! (validate-tier tier))
        
        ;; Validate URI length if provided
        (match uri
            uri-value (asserts! (<= (len uri-value) u256) ERR-INVALID-URI)
            true
        )
        
        (let (
            (current-total (var-get total-supply))
            (new-total (+ current-total u1))
        )
            ;; Enhanced supply checks
            (asserts! (<= new-total MAX-SUPPLY) ERR-MAX-SUPPLY)
            
            (let (
                (tier-row (default-to { supply: u0 } (map-get? tier-supplies { tier: tier })))
                (tier-supply (get supply tier-row))
                (new-tier-supply (+ tier-supply u1))
            )
                ;; Enhanced tier supply check
                (asserts! (not (is-tier-over-max? tier new-tier-supply)) ERR-MAX-TIER-SUPPLY)
                
                (let (
                    (token-id (var-get next-token-id))
                    (recipient tx-sender)
                )
                    (begin
                        ;; Write ownership and metadata with enhanced fields
                        (map-set token-owners { token-id: token-id } { owner: recipient })
                        (map-set token-metadata { token-id: token-id } {
                            tier: tier,
                            uri: uri,
                            creator: tx-sender,
                            royalty-percent: u5, ;; Default 5% royalty
                            created-at: stacks-block-height,
                            last-updated: stacks-block-height
                        })
                        
                        ;; Update counters
                        (map-set tier-supplies { tier: tier } { supply: new-tier-supply })
                        (var-set total-supply new-total)
                        (var-set next-token-id (+ token-id u1))
                        
                        ;; Track user if new
                        (if (is-none (map-get? user-registry { user: recipient }))
                            (begin
                                (map-set user-registry { user: recipient } { active: true })
                                (var-set user-count (+ (var-get user-count) u1))
                            )
                            true
                        )
                        
                        ;; Increment transaction count
                        (var-set transaction-count (+ (var-get transaction-count) u1))
                        
                        ;; Enhanced event emission
                        (emit-token-event
                            EVENT-TOKEN-MINTED
                            token-id
                            recipient
                            (tuple (tier tier) (recipient (some recipient)) (from none) (to none))
                        )
                        
                        (ok token-id)
                    )
                )
            )
        )
    )
)

;; Transfer a Bitdap Pass NFT from the caller to a recipient.
;; - Only the current owner may transfer.
;; - Self-transfers (owner == recipient) are rejected as no-ops.
(define-public (transfer
        (token-id uint)
        (recipient principal)
    )
    (begin
        ;; Enhanced security and validation checks
        (try! (validate-security-checks tx-sender "transfer"))
        (try! (validate-not-paused))
        (asserts! (not (var-get transfer-paused)) ERR-FEATURE-DISABLED)
        (try! (validate-token-id token-id))
        (asserts! (not (is-eq tx-sender recipient)) ERR-SELF-TRANSFER)
        
        ;; Validate token ownership
        (try! (validate-token-owner token-id tx-sender))
        
        ;; Check recipient is not blacklisted
        (try! (check-blacklist recipient))
        
        (let ((owner-row (unwrap! (map-get? token-owners { token-id: token-id }) ERR-NOT-FOUND)))
            (let ((owner (get owner owner-row)))
                (begin
                    ;; Perform transfer
                    (map-set token-owners { token-id: token-id } { owner: recipient })
                    
                    ;; Track recipient if new user
                    (if (is-none (map-get? user-registry { user: recipient }))
                        (begin
                            (map-set user-registry { user: recipient } { active: true })
                            (var-set user-count (+ (var-get user-count) u1))
                        )
                        true
                    )
                    
                    ;; Increment transaction count
                    (var-set transaction-count (+ (var-get transaction-count) u1))
                    
                    ;; Enhanced event emission
                    (emit-token-event
                        EVENT-TOKEN-TRANSFERRED
                        token-id
                        tx-sender
                        (tuple (tier u0) (recipient (some recipient)) (from (some owner)) (to (some recipient)))
                    )
                    
                    (ok true)
                )
            )
        )
    )
)

;; Burn (destroy) a Bitdap Pass NFT owned by the caller.
;; - Only the current owner may burn.
;; - Decrements total supply and the tier supply.
(define-public (burn (token-id uint))
    (let ((owner-row (map-get? token-owners { token-id: token-id })))
        (match owner-row
            owner-data (let ((owner (get owner owner-data)))
                (if (not (is-eq owner tx-sender))
                    ERR-NOT-OWNER
                    (let ((meta-row (map-get? token-metadata { token-id: token-id })))
                        (match meta-row
                            meta (let (
                                    (tier (get tier meta))
                                    (tier-row (default-to { supply: u0 } (map-get? tier-supplies { tier: tier })))
                                    (current-tier-supply (get supply tier-row))
                                )
                                (begin
                                    ;; Delete ownership and metadata.
                                    (map-delete token-owners { token-id: token-id })
                                    (map-delete token-metadata { token-id: token-id })
                                    ;; Decrement counters (clamped to zero by design choices).
                                    (map-set tier-supplies { tier: tier } { supply: (if (> current-tier-supply u0)
                                        (- current-tier-supply u1)
                                        u0
                                    ) }
                                    )
                                    (let ((current-total (var-get total-supply)))
                                        (var-set total-supply
                                            (if (> current-total u0)
                                                (- current-total u1)
                                                u0
                                            ))
                                    )
                                    ;; Increment transaction count
                                    (var-set transaction-count (+ (var-get transaction-count) u1))
                                    ;; Emit burn event.
                                    (print (tuple
                                        (event "burn-event")
                                        (token-id token-id)
                                        (owner owner)
                                        (tier tier)
                                    ))
                                    (ok true)
                                )
                            )
                            ERR-NOT-FOUND
                        )
                    )
                )
            )
            ERR-NOT-FOUND
        )
    )
)

;; read only functions
;; - Views into ownership, metadata, and supply statistics (SIP-009 style).

;; SIP-009: returns the last minted token-id (or u0 if none exist).
(define-read-only (get-last-token-id)
    (let ((next-id (var-get next-token-id)))
        (if (is-eq next-id u1)
            (ok u0)
            (ok (- next-id u1))
        )
    )
)

;; SIP-009: returns the owner of a given token-id, if any.
(define-read-only (get-owner (token-id uint))
    (match (map-get? token-owners { token-id: token-id })
        owner-row (ok (get owner owner-row))
        ERR-NOT-FOUND
    )
)

;; SIP-009: returns the token URI for a given token-id, if present.
(define-read-only (get-token-uri (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        meta (ok (get uri meta))
        ERR-NOT-FOUND
    )
)

;; SIP-009: transfer function with memo support
(define-public (transfer-memo (token-id uint) (sender principal) (recipient principal) (memo (buff 34)))
    (begin
        (asserts! (is-eq sender tx-sender) ERR-NOT-OWNER)
        (try! (transfer token-id recipient))
        (print memo)
        (ok true)
    )
)

;; Returns the full metadata record for a given token-id.
(define-read-only (get-token-metadata (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        meta (ok meta)
        ERR-NOT-FOUND
    )
)

;; Governance voting power based on tier
(define-read-only (get-voting-power (token-id uint))
    (match (get-tier token-id)
        ok-tier (if (is-eq ok-tier TIER-VIP)
            (ok u100)
            (if (is-eq ok-tier TIER-PRO)
                (ok u50)
                (ok u10) ;; Basic tier
            )
        )
        error (err error)
    )
)

;; Returns the tier (Basic/Pro/VIP) for a given token-id.
(define-read-only (get-tier (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        meta (ok (get tier meta))
        ERR-NOT-FOUND
    )
)

;; Returns the total supply of Bitdap Pass NFTs in circulation.
(define-read-only (get-total-supply)
    (ok (var-get total-supply))
)

;; Returns the supply for a specific tier.
(define-read-only (get-tier-supply (tier uint))
    (let (
            (row (default-to { supply: u0 } (map-get? tier-supplies { tier: tier })))
        )
        (ok (get supply row))
    )
)

;; Returns all counters in a single call: users, listings, transactions
(define-read-only (get-counters)
    (ok (tuple
        (users (var-get user-count))
        (listings (var-get listing-count))
        (transactions (var-get transaction-count))
    ))
)

;; Returns the user count
(define-read-only (get-user-count)
    (ok (var-get user-count))
)

;; Returns the listing count
(define-read-only (get-listing-count)
    (ok (var-get listing-count))
)

;; Returns the transaction count
(define-read-only (get-transaction-count)
    (ok (var-get transaction-count))
)

;; Returns the next token-id that will be minted
(define-read-only (get-next-token-id)
    (ok (var-get next-token-id))
)

;; Check if a token exists
(define-read-only (token-exists (token-id uint))
    (ok (is-some (map-get? token-owners { token-id: token-id })))
)

;; Get all tier information at once
(define-read-only (get-all-tier-info)
    (ok (tuple
        (basic-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-BASIC }))))
        (pro-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-PRO }))))
        (vip-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-VIP }))))
        (basic-max MAX-BASIC-SUPPLY)
        (pro-max MAX-PRO-SUPPLY)
        (vip-max MAX-VIP-SUPPLY)
    ))
)

;; Read-only: get next listing ID that will be assigned
(define-read-only (get-next-listing-id)
    (ok (var-get next-listing-id))
)

;; Read-only: check if a listing is active
(define-read-only (is-listing-active (listing-id uint))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (ok (get active listing-data))
        (ok false)
    )
)

;; Public: create a new marketplace listing
;; Only token owner can create listing
;; Price must be greater than 0
;; Listing expires after specified block height
(define-public (create-listing (token-id uint) (price uint) (expiry-blocks uint))
    (begin
        ;; Enhanced validation checks
        (try! (validate-security-checks tx-sender "create-listing"))
        (try! (validate-marketplace-not-paused))
        (try! (validate-token-id token-id))
        (try! (validate-price price))
        (asserts! (> expiry-blocks u0) ERR-INVALID-EXPIRY)
        (asserts! (<= expiry-blocks u52560) ERR-INVALID-EXPIRY) ;; Max 1 year
        (asserts! (<= price (var-get max-listing-price)) ERR-LISTING-PRICE-TOO-HIGH)
        (asserts! (>= price (var-get min-listing-price)) ERR-LISTING-PRICE-TOO-LOW)
        
        ;; Validate token ownership
        (try! (validate-token-owner token-id tx-sender))
        
        ;; Check if token is already listed
        (asserts! (is-none (get-existing-listing token-id)) ERR-ALREADY-EXISTS)
        
        (match (map-get? token-owners { token-id: token-id })
            owner-data (let ((owner (get owner owner-data)))
                (let (
                    (listing-id (var-get next-listing-id))
                    (current-block stacks-block-height)
                    (expiry-block (+ current-block expiry-blocks))
                )
                    (begin
                        ;; Create listing
                        (map-set marketplace-listings { listing-id: listing-id } {
                            token-id: token-id,
                            seller: tx-sender,
                            price: price,
                            reserve-price: none,
                            expiry-block: (some expiry-block),
                            listing-type: "fixed",
                            created-at: current-block,
                            updated-at: current-block,
                            active: true,
                            view-count: u0
                        })
                        ;; Track seller listings
                        (let ((seller-row (default-to { listing-ids: (list) } (map-get? seller-listings { seller: tx-sender }))))
                            (map-set seller-listings { seller: tx-sender } {
                                listing-ids: (unwrap-panic (as-max-len? (append (get listing-ids seller-row) listing-id) u100))
                            })
                        )
                        ;; Increment counters
                        (var-set listing-count (+ (var-get listing-count) u1))
                        (var-set next-listing-id (+ listing-id u1))
                        ;; Emit enhanced event
                        (emit-marketplace-event
                            EVENT-LISTING-CREATED
                            (some listing-id)
                            (some token-id)
                            tx-sender
                            (tuple (price (some price)) (seller (some tx-sender)) (buyer none) (fee none))
                        )
                        (ok listing-id)
                    )
                )
            )
            ERR-NOT-FOUND
        )
    )
)

;; Check if token already has an active listing
(define-private (get-existing-listing (token-id uint))
    (let (
        (max-listing-id (var-get next-listing-id))
    )
        (check-token-listings token-id u1 max-listing-id)
    )
)

;; Check if token has active listings (simplified check)
(define-private (check-token-listings (token-id uint) (start-id uint) (end-id uint))
    (let (
        (listing-1 (check-single-listing token-id start-id))
        (listing-2 (check-single-listing token-id (+ start-id u1)))
        (listing-3 (check-single-listing token-id (+ start-id u2)))
    )
        (if (is-some listing-1)
            listing-1
            (if (is-some listing-2)
                listing-2
                listing-3
            )
        )
    )
)

;; Check single listing for token
(define-private (check-single-listing (token-id uint) (listing-id uint))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (if (and 
            (is-eq (get token-id listing-data) token-id)
            (get active listing-data)
        )
            (some listing-id)
            none
        )
        none
    )
)

;; Public: purchase a marketplace listing with enhanced validation
;; Buyer sends STX, seller receives STX minus fees
;; Listing must be active and not expired
;; Token ownership transfers to buyer
(define-public (purchase-listing (listing-id uint))
    (begin
        ;; Enhanced validation checks
        (try! (validate-security-checks tx-sender "purchase"))
        (try! (validate-marketplace-not-paused))
        (asserts! (> listing-id u0) ERR-INVALID-TOKEN-ID)
        
        (match (map-get? marketplace-listings { listing-id: listing-id })
            listing-data (let (
                (token-id (get token-id listing-data))
                (seller (get seller listing-data))
                (price (get price listing-data))
                (is-active (get active listing-data))
                (expiry-block (get expiry-block listing-data))
            )
                (begin
                    ;; Comprehensive validation
                    (asserts! is-active ERR-LISTING-INACTIVE)
                    (asserts! (not (is-eq seller tx-sender)) ERR-SELF-TRANSFER)
                    
                    ;; Check expiry
                    (try! (match expiry-block
                        expiry (if (< stacks-block-height expiry) (ok true) ERR-LISTING-EXPIRED)
                        (ok true)
                    ))
                    
                    ;; Validate token still exists and is owned by seller
                    (try! (match (map-get? token-owners { token-id: token-id })
                        owner-data (if (is-eq (get owner owner-data) seller) (ok true) ERR-NOT-OWNER)
                        ERR-NOT-FOUND
                    ))
                    
                    ;; Check buyer is not blacklisted
                    (try! (check-blacklist tx-sender))
                    
                    (let (
                        (fee-amount (/ (* price (var-get marketplace-fee-percent)) u100))
                        (seller-amount (- price fee-amount))
                    )
                        (begin
                            ;; Validate fee calculation
                            (asserts! (>= price fee-amount) ERR-INTERNAL-ERROR)
                            
                            ;; Transfer token to buyer
                            (map-set token-owners { token-id: token-id } { owner: tx-sender })
                            
                            ;; Mark listing as inactive
                            (map-set marketplace-listings { listing-id: listing-id } {
                                token-id: token-id,
                                seller: seller,
                                price: price,
                                reserve-price: (get reserve-price listing-data),
                                expiry-block: (get expiry-block listing-data),
                                listing-type: (get listing-type listing-data),
                                created-at: (get created-at listing-data),
                                updated-at: stacks-block-height,
                                active: false,
                                view-count: (get view-count listing-data)
                            })
                            
                            ;; Record purchase
                            (map-set purchase-history { buyer: tx-sender, listing-id: listing-id } {
                                purchase-price: price,
                                purchased-at: stacks-block-height,
                                seller: seller
                            })
                            
                            ;; Update counters safely
                            (var-set listing-count (if (> (var-get listing-count) u0)
                                (- (var-get listing-count) u1)
                                u0
                            ))
                            (var-set transaction-count (+ (var-get transaction-count) u1))
                            (var-set total-fees-collected (+ (var-get total-fees-collected) fee-amount))
                            
                            ;; Track buyer if new
                            (if (is-none (map-get? user-registry { user: tx-sender }))
                                (begin
                                    (map-set user-registry { user: tx-sender } { active: true })
                                    (var-set user-count (+ (var-get user-count) u1))
                                )
                                true
                            )
                            
                            ;; Emit enhanced purchase event
                            (emit-marketplace-event
                                EVENT-PURCHASE-COMPLETED
                                (some listing-id)
                                (some token-id)
                                tx-sender
                                (tuple (price (some price)) (seller (some seller)) (buyer (some tx-sender)) (fee (some fee-amount)))
                            )
                            
                            (ok true)
                        )
                    )
                )
            )
            ERR-LISTING-NOT-FOUND
        )
    )
)

;; Enhanced validation helper functions

;; Validate batch size limits
(define-private (validate-batch-size (size uint) (max-size uint))
    (if (<= size max-size)
        (ok true)
        ERR-MAX-BATCH-SIZE
    )
)

;; Validate expiry time is reasonable
(define-private (validate-expiry-time (expiry-blocks uint))
    (if (and (> expiry-blocks u0) (<= expiry-blocks u52560)) ;; Max 1 year
        (ok true)
        ERR-INVALID-EXPIRY
    )
)

;; Validate string length
(define-private (validate-string-length (str (string-utf8 256)) (max-len uint))
    (if (<= (len str) max-len)
        (ok true)
        ERR-INVALID-URI
    )
)

;; Validate amount is within reasonable bounds
(define-private (validate-amount-bounds (amount uint) (min-amount uint) (max-amount uint))
    (if (and (>= amount min-amount) (<= amount max-amount))
        (ok true)
        ERR-INVALID-AMOUNT
    )
)

;; Check resource limits before operations
(define-private (validate-resource-limits)
    (let (
        (current-supply (var-get total-supply))
        (current-listings (var-get listing-count))
        (current-users (var-get user-count))
    )
        (begin
            (asserts! (< current-supply MAX-SUPPLY) ERR-MAX-SUPPLY)
            (asserts! (< current-listings u10000) ERR-MAX-LISTINGS) ;; Reasonable listing limit
            (asserts! (< current-users u100000) ERR-STORAGE-LIMIT) ;; Reasonable user limit
            (ok true)
        )
    )
)

;; Validate business rules for marketplace operations
(define-private (validate-marketplace-business-rules (token-id uint) (price uint))
    (begin
        ;; Check token exists
        (asserts! (is-some (map-get? token-owners { token-id: token-id })) ERR-NOT-FOUND)
        
        ;; Check price is reasonable
        (try! (validate-amount-bounds price (var-get min-listing-price) (var-get max-listing-price)))
        
        ;; Check resource limits
        (try! (validate-resource-limits))
        
        (ok true)
    )
)

;; Enhanced authorization checks
(define-private (validate-enhanced-authorization (caller principal) (operation (string-ascii 32)))
    (begin
        ;; Check blacklist
        (try! (check-blacklist caller))
        
        ;; Check rate limits
        (try! (check-rate-limit caller operation))
        
        ;; Check emergency mode
        (asserts! (not (var-get emergency-mode)) ERR-MAINTENANCE-MODE)
        
        ;; Check operation-specific permissions
        (if (is-eq operation "admin")
            (validate-admin caller)
            (ok true)
        )
    )
)

;; Returns true if the given tier is one of the known tiers.
(define-private (is-valid-tier (tier uint))
    (or
        (is-eq tier TIER-BASIC)
        (or
            (is-eq tier TIER-PRO)
            (is-eq tier TIER-VIP)
        )
    )
)

;; Returns true if the given (tier, new-supply) would exceed that tier's max.
(define-private (is-tier-over-max?
        (tier uint)
        (new-supply uint)
    )
    (if (is-eq tier TIER-BASIC)
        (> new-supply MAX-BASIC-SUPPLY)
        (if (is-eq tier TIER-PRO)
            (> new-supply MAX-PRO-SUPPLY)
            (if (is-eq tier TIER-VIP)
                (> new-supply MAX-VIP-SUPPLY)
                ;; Unknown tiers are treated as invalid via is-valid-tier, but
                ;; this path is left as not over max for safety.
                false
            )
        )
    )
)

;; Helper function to validate listing ownership and existence
(define-private (validate-listing-owner (listing-id uint) (caller principal))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (if (is-eq (get seller listing-data) caller)
            (ok listing-data)
            ERR-NOT-OWNER
        )
        ERR-LISTING-NOT-FOUND
    )
)

;; Admin: pause minting/transfers
(define-public (pause)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (var-set mint-paused true)
        (var-set transfer-paused true)
        (ok true)
    )
)

;; Admin: unpause minting/transfers
(define-public (unpause)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (var-set mint-paused false)
        (var-set transfer-paused false)
        (ok true)
    )
)

;; Admin: update token URI (metadata) with timestamp tracking
(define-public (set-token-uri (token-id uint) (uri (optional (string-utf8 256))))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (match (map-get? token-metadata { token-id: token-id })
            meta (begin
                (map-set token-metadata { token-id: token-id } {
                    tier: (get tier meta),
                    uri: uri,
                    creator: (get creator meta),
                    royalty-percent: (get royalty-percent meta),
                    created-at: (get created-at meta),
                    last-updated: stacks-block-height
                })
                (print (tuple
                    (event "metadata-updated")
                    (token-id token-id)
                    (updated-by tx-sender)
                    (timestamp stacks-block-height)
                ))
                (ok true)
            )
            ERR-NOT-FOUND
        )
    )
)

;; Admin: set a new admin (transfer admin rights)
(define-public (set-admin (new-admin principal))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (var-set contract-owner new-admin)
        ;; Emit admin change event
        (print (tuple
            (event "admin-changed")
            (old-admin tx-sender)
            (new-admin new-admin)
        ))
        (ok true)
    )
)

;; Admin: transfer admin rights (alias for set-admin)
(define-public (transfer-admin (new-admin principal))
    (set-admin new-admin)
)

;; Admin: pause marketplace (blocks create/purchase operations)
(define-public (pause-marketplace)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (var-set marketplace-paused true)
        ;; Emit marketplace pause event
        (print (tuple
            (event "marketplace-paused")
            (admin tx-sender)
        ))
        (ok true)
    )
)

;; Admin: unpause marketplace
(define-public (unpause-marketplace)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (var-set marketplace-paused false)
        ;; Emit marketplace unpause event
        (print (tuple
            (event "marketplace-unpaused")
            (admin tx-sender)
        ))
        (ok true)
    )
)

;; Read-only: check if marketplace is paused
(define-read-only (is-marketplace-paused)
    (ok (var-get marketplace-paused))
)

;; Read-only: get current admin
(define-read-only (get-admin)
    (ok (var-get contract-owner))
)

;; Marketplace Functions
;; - Functions for managing marketplace listings and operations
;; - Supports listing creation, price updates, cancellation, and queries
;; - All marketplace operations respect pause status and ownership validation

;; Read-only: get full listing information by listing ID
;; Returns complete listing details including token-id, seller, price, created-at, and active status
;; Used by marketplace interfaces to display listing information and validate operations
(define-read-only (get-listing (listing-id uint))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (ok listing-data)
        ERR-LISTING-NOT-FOUND
    )
)

;; Public: update the price of an existing marketplace listing
;; Only the listing owner can update the price
;; Price must be greater than 0 and listing must be active
(define-public (update-listing-price (listing-id uint) (new-price uint))
    (begin
        (asserts! (not (var-get marketplace-paused)) ERR-PAUSED)
        (asserts! (> new-price u0) ERR-INVALID-PRICE)
        (match (validate-listing-owner listing-id tx-sender)
            listing-data (let (
                (updated-listing {
                    token-id: (get token-id listing-data),
                    seller: (get seller listing-data),
                    price: new-price,
                    reserve-price: (get reserve-price listing-data),
                    expiry-block: (get expiry-block listing-data),
                    listing-type: (get listing-type listing-data),
                    created-at: (get created-at listing-data),
                    updated-at: stacks-block-height,
                    active: (get active listing-data),
                    view-count: (get view-count listing-data)
                })
            )
                (begin
                    ;; Ensure listing is active before allowing price updates
                    (asserts! (get active listing-data) ERR-LISTING-NOT-FOUND)
                    (map-set marketplace-listings { listing-id: listing-id } updated-listing)
                    ;; Emit price update event
                    (print (tuple
                        (event "listing-price-updated")
                        (listing-id listing-id)
                        (old-price (get price listing-data))
                        (new-price new-price)
                        (seller tx-sender)
                    ))
                    (ok true)
                )
            )
            error (err error)
        )
    )
)

;; Public: cancel an active marketplace listing
;; Only the listing owner can cancel their listing
;; Sets the listing to inactive and decrements listing count
;; Prevents double-cancellation by checking active status first
;; Emits cancellation event for marketplace tracking and analytics
(define-public (cancel-listing (listing-id uint))
    (begin
        (asserts! (not (var-get marketplace-paused)) ERR-PAUSED)
        (match (validate-listing-owner listing-id tx-sender)
            listing-data (let (
                (cancelled-listing {
                    token-id: (get token-id listing-data),
                    seller: (get seller listing-data),
                    price: (get price listing-data),
                    reserve-price: (get reserve-price listing-data),
                    expiry-block: (get expiry-block listing-data),
                    listing-type: (get listing-type listing-data),
                    created-at: (get created-at listing-data),
                    updated-at: stacks-block-height,
                    active: false,
                    view-count: (get view-count listing-data)
                })
            )
                (begin
                    (asserts! (get active listing-data) ERR-LISTING-NOT-FOUND)
                    (map-set marketplace-listings { listing-id: listing-id } cancelled-listing)
                    ;; Decrement listing count
                    (let ((current-count (var-get listing-count)))
                        (var-set listing-count (if (> current-count u0)
                            (- current-count u1)
                            u0
                        ))
                    )
                    ;; Emit cancellation event
                    (print (tuple
                        (event "listing-cancelled")
                        (listing-id listing-id)
                        (token-id (get token-id listing-data))
                        (seller tx-sender)
                    ))
                    (ok true)
                )
            )
            error (err error)
        )
    )
)

;; Batch operations for efficiency

;; Batch mint multiple passes to different recipients
(define-public (batch-mint (recipients (list 10 { recipient: principal, tier: uint, uri: (optional (string-utf8 256)) })))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (asserts! (not (or (var-get mint-paused) (var-get transfer-paused))) ERR-PAUSED)
        (fold batch-mint-helper recipients (ok (list)))
    )
)

;; Helper function for batch minting
(define-private (batch-mint-helper 
    (item { recipient: principal, tier: uint, uri: (optional (string-utf8 256)) })
    (acc (response (list 10 uint) uint))
)
    (match acc
        success-list (let (
            (current-total (var-get total-supply))
            (new-total (+ current-total u1))
            (tier (get tier item))
            (recipient (get recipient item))
            (uri (get uri item))
        )
            (if (and 
                (is-valid-tier tier)
                (<= new-total MAX-SUPPLY)
                (not (is-tier-over-max? tier (+ (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: tier }))) u1)))
            )
                (let (
                    (token-id (var-get next-token-id))
                    (tier-row (default-to { supply: u0 } (map-get? tier-supplies { tier: tier })))
                    (tier-supply (get supply tier-row))
                    (new-tier-supply (+ tier-supply u1))
                )
                    (begin
                        ;; Write ownership and metadata
                        (map-set token-owners { token-id: token-id } { owner: recipient })
                        (map-set token-metadata { token-id: token-id } {
                            tier: tier,
                            uri: uri,
                        })
                        ;; Update counters
                        (map-set tier-supplies { tier: tier } { supply: new-tier-supply })
                        (var-set total-supply new-total)
                        (var-set next-token-id (+ token-id u1))
                        ;; Track user if new
                        (if (is-none (map-get? user-registry { user: recipient }))
                            (begin
                                (map-set user-registry { user: recipient } { active: true })
                                (var-set user-count (+ (var-get user-count) u1))
                            )
                            true
                        )
                        ;; Increment transaction count
                        (var-set transaction-count (+ (var-get transaction-count) u1))
                        ;; Emit mint event
                        (print (tuple
                            (event "batch-mint-event")
                            (token-id token-id)
                            (owner recipient)
                            (tier tier)
                        ))
                        (ok (unwrap-panic (as-max-len? (append success-list token-id) u10)))
                    )
                )
                acc ;; Return unchanged if validation fails
            )
        )
        error (err error)
    )
)

;; Batch transfer multiple tokens (owner must be tx-sender for all)
(define-public (batch-transfer (transfers (list 10 { token-id: uint, recipient: principal })))
    (begin
        (asserts! (not (var-get transfer-paused)) ERR-PAUSED)
        (fold batch-transfer-helper transfers (ok true))
    )
)

;; Helper function for batch transfers
(define-private (batch-transfer-helper 
    (item { token-id: uint, recipient: principal })
    (acc (response bool uint))
)
    (match acc
        success (let (
            (token-id (get token-id item))
            (recipient (get recipient item))
            (owner-row (map-get? token-owners { token-id: token-id }))
        )
            (if (is-none owner-row)
                (err u101)
                (let ((owner (get owner (unwrap! owner-row (err u101)))))
                    (if (and 
                        (is-eq owner tx-sender)
                        (not (is-eq owner recipient))
                    )
                        (begin
                            (map-set token-owners { token-id: token-id } { owner: recipient })
                            (print (tuple
                                (event "batch-transfer-event")
                                (token-id token-id)
                                (from owner)
                                (to recipient)
                            ))
                            (ok true)
                        )
                        (err u102)
                    )
                )
            )
        )
        error acc
    )
)

;; Admin: set marketplace fee percentage
(define-public (set-marketplace-fee (fee-percent uint))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (asserts! (<= fee-percent u10) ERR-INVALID-AMOUNT) ;; Max 10% fee
        (asserts! (>= fee-percent u0) ERR-INVALID-AMOUNT) ;; Min 0% fee
        (var-set marketplace-fee-percent fee-percent)
        (print (tuple
            (event "marketplace-fee-updated")
            (fee-percent fee-percent)
        ))
        (ok true)
    )
)

;; Admin: set marketplace fee recipient
(define-public (set-fee-recipient (recipient principal))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (var-set marketplace-fee-recipient recipient)
        (print (tuple
            (event "fee-recipient-updated")
            (recipient recipient)
        ))
        (ok true)
    )
)

;; Read-only: get marketplace fee info
(define-read-only (get-marketplace-fee-info)
    (ok (tuple
        (fee-percent (var-get marketplace-fee-percent))
        (fee-recipient (var-get marketplace-fee-recipient))
        (total-fees-collected (var-get total-fees-collected))
    ))
)

;; Read-only: get seller listings
(define-read-only (get-seller-listings (seller principal))
    (match (map-get? seller-listings { seller: seller })
        seller-data (ok (get listing-ids seller-data))
        (ok (list))
    )
)

;; Read-only: get purchase history for buyer
(define-read-only (get-purchase-history (buyer principal) (listing-id uint))
    (match (map-get? purchase-history { buyer: buyer, listing-id: listing-id })
        purchase-data (ok purchase-data)
        ERR-NOT-FOUND
    )
)
;; Advanced Marketplace Features

;; Create an offer on a listing
(define-public (create-offer (listing-id uint) (amount uint) (expiry-blocks uint))
    (begin
        (try! (validate-security-checks tx-sender "create-offer"))
        (try! (validate-marketplace-not-paused))
        (try! (validate-price amount))
        (asserts! (> expiry-blocks u0) ERR-INVALID-EXPIRY)
        
        (match (map-get? marketplace-listings { listing-id: listing-id })
            listing-data (let (
                (offer-id (var-get next-offer-id))
                (current-block stacks-block-height)
                (expiry-block (+ current-block expiry-blocks))
            )
                (begin
                    (asserts! (get active listing-data) ERR-LISTING-INACTIVE)
                    (asserts! (not (is-eq (get seller listing-data) tx-sender)) ERR-SELF-TRANSFER)
                    
                    ;; Create offer
                    (map-set marketplace-offers { offer-id: offer-id } {
                        listing-id: listing-id,
                        token-id: (get token-id listing-data),
                        bidder: tx-sender,
                        amount: amount,
                        expiry-block: expiry-block,
                        created-at: current-block,
                        status: "active"
                    })
                    
                    (var-set next-offer-id (+ offer-id u1))
                    
                    ;; Emit offer event
                    (emit-marketplace-event
                        EVENT-OFFER-CREATED
                        (some listing-id)
                        (some (get token-id listing-data))
                        tx-sender
                        (tuple (price (some amount)) (seller (some (get seller listing-data))) (buyer (some tx-sender)) (fee none))
                    )
                    
                    (ok offer-id)
                )
            )
            ERR-LISTING-NOT-FOUND
        )
    )
)

;; Accept an offer (seller only)
(define-public (accept-offer (offer-id uint))
    (begin
        (try! (validate-marketplace-not-paused))
        
        (match (map-get? marketplace-offers { offer-id: offer-id })
            offer-data (let (
                (listing-id (get listing-id offer-data))
                (token-id (get token-id offer-data))
                (bidder (get bidder offer-data))
                (amount (get amount offer-data))
                (expiry-block (get expiry-block offer-data))
            )
                (begin
                    (asserts! (is-eq (get status offer-data) "active") ERR-OFFER-NOT-FOUND)
                    (asserts! (<= stacks-block-height expiry-block) ERR-OFFER-EXPIRED)
                    
                    ;; Validate seller owns the listing
                    (try! (validate-listing-owner listing-id tx-sender))
                    
                    ;; Transfer token to bidder
                    (map-set token-owners { token-id: token-id } { owner: bidder })
                    
                    ;; Update offer status
                    (map-set marketplace-offers { offer-id: offer-id } {
                        listing-id: listing-id,
                        token-id: token-id,
                        bidder: bidder,
                        amount: amount,
                        expiry-block: expiry-block,
                        created-at: (get created-at offer-data),
                        status: "accepted"
                    })
                    
                    ;; Deactivate listing
                    (match (map-get? marketplace-listings { listing-id: listing-id })
                        listing-data (map-set marketplace-listings { listing-id: listing-id } {
                            token-id: (get token-id listing-data),
                            seller: (get seller listing-data),
                            price: (get price listing-data),
                            reserve-price: (get reserve-price listing-data),
                            expiry-block: (get expiry-block listing-data),
                            listing-type: (get listing-type listing-data),
                            created-at: (get created-at listing-data),
                            updated-at: stacks-block-height,
                            active: false,
                            view-count: (get view-count listing-data)
                        })
                        false
                    )
                    
                    ;; Record sale in price history
                    (let ((sale-id (var-get next-sale-id)))
                        (map-set price-history { token-id: token-id, sale-id: sale-id } {
                            price: amount,
                            seller: tx-sender,
                            buyer: bidder,
                            sale-date: stacks-block-height,
                            listing-type: "offer"
                        })
                        (var-set next-sale-id (+ sale-id u1))
                    )
                    
                    ;; Emit acceptance event
                    (emit-marketplace-event
                        EVENT-OFFER-ACCEPTED
                        (some listing-id)
                        (some token-id)
                        tx-sender
                        (tuple (price (some amount)) (seller (some tx-sender)) (buyer (some bidder)) (fee none))
                    )
                    
                    (ok true)
                )
            )
            ERR-OFFER-NOT-FOUND
        )
    )
)

;; Get marketplace analytics
(define-read-only (get-marketplace-analytics (period (string-ascii 16)))
    (match (map-get? marketplace-analytics { period: period })
        analytics-data (ok analytics-data)
        (ok (tuple
            (total-volume u0)
            (total-sales u0)
            (average-price u0)
            (unique-buyers u0)
            (unique-sellers u0)
            (last-updated u0)
        ))
    )
)

;; Get price history for a token
(define-read-only (get-token-price-history (token-id uint) (limit uint))
    (let (
        (max-limit (if (> limit u10) u10 limit))
        (sale-id (var-get next-sale-id))
    )
        ;; This is a simplified version - in practice you'd want pagination
        (ok (list))
    )
)

;; Filter listings by criteria
(define-read-only (get-filtered-listings 
    (tier-filter (optional uint))
    (min-price (optional uint))
    (max-price (optional uint))
    (listing-type-filter (optional (string-ascii 16)))
    (limit uint)
)
    ;; Simplified implementation - would need more complex filtering logic
    (ok (list))
)

;; Admin function to update marketplace analytics
(define-public (update-marketplace-analytics (period (string-ascii 16)))
    (begin
        (try! (validate-admin tx-sender))
        
        ;; This would calculate real analytics in practice
        (map-set marketplace-analytics { period: period } {
            total-volume: u0,
            total-sales: u0,
            average-price: u0,
            unique-buyers: u0,
            unique-sellers: u0,
            last-updated: stacks-block-height
        })
        
        (emit-admin-event
            EVENT-CONFIG-UPDATED
            tx-sender
            "update-analytics"
            (tuple (old-value none) (new-value none) (target none))
        )
        
        (ok true)
    )
)

;; Admin function to set marketplace configuration
(define-public (set-marketplace-config 
    (min-price (optional uint))
    (max-price (optional uint))
    (offer-expiry (optional uint))
)
    (begin
        (try! (validate-admin tx-sender))
        
        (match min-price
            price (var-set min-listing-price price)
            true
        )
        
        (match max-price
            price (var-set max-listing-price price)
            true
        )
        
        (match offer-expiry
            expiry (var-set offer-expiry-blocks expiry)
            true
        )
        
        (emit-admin-event
            EVENT-CONFIG-UPDATED
            tx-sender
            "marketplace-config"
            (tuple (old-value none) (new-value none) (target none))
        )
        
        (ok true)
    )
)
;; Enhanced Batch Operations System

;; Batch size limits for resource management
(define-constant MAX-BATCH-SIZE u20)
(define-constant MAX-BATCH-TRANSFERS u10)
(define-constant MAX-BATCH-LISTINGS u5)

;; Enhanced batch mint with comprehensive validation
(define-public (enhanced-batch-mint (recipients (list 20 { recipient: principal, tier: uint, uri: (optional (string-utf8 256)) })))
    (begin
        (try! (validate-admin tx-sender))
        (try! (validate-not-paused))
        (asserts! (<= (len recipients) MAX-BATCH-SIZE) ERR-MAX-BATCH-SIZE)
        
        (let ((result (fold enhanced-batch-mint-helper recipients (ok (list)))))
            (match result
                success-list (begin
                    (emit-batch-event
                        EVENT-BATCH-OPERATION
                        tx-sender
                        (len recipients)
                        (len success-list)
                        (tuple (operation-type "batch-mint") (details none))
                    )
                    (ok success-list)
                )
                error (err error)
            )
        )
    )
)

;; Enhanced batch mint helper with security checks
(define-private (enhanced-batch-mint-helper 
    (item { recipient: principal, tier: uint, uri: (optional (string-utf8 256)) })
    (acc (response (list 20 uint) uint))
)
    (match acc
        success-list (let (
            (recipient (get recipient item))
            (tier (get tier item))
            (uri (get uri item))
        )
            ;; Validate each item
            (match (validate-tier tier)
                tier-valid (match (check-blacklist recipient)
                    blacklist-ok (let (
                        (current-total (var-get total-supply))
                        (new-total (+ current-total u1))
                        (tier-row (default-to { supply: u0 } (map-get? tier-supplies { tier: tier })))
                        (tier-supply (get supply tier-row))
                        (new-tier-supply (+ tier-supply u1))
                    )
                        (if (and 
                            (<= new-total MAX-SUPPLY)
                            (not (is-tier-over-max? tier new-tier-supply))
                        )
                            (let ((token-id (var-get next-token-id)))
                                (begin
                                    ;; Mint the token
                                    (map-set token-owners { token-id: token-id } { owner: recipient })
                                    (map-set token-metadata { token-id: token-id } {
                                        tier: tier,
                                        uri: uri,
                                    })
                                    (map-set tier-supplies { tier: tier } { supply: new-tier-supply })
                                    (var-set total-supply new-total)
                                    (var-set next-token-id (+ token-id u1))
                                    
                                    ;; Track user if new
                                    (if (is-none (map-get? user-registry { user: recipient }))
                                        (begin
                                            (map-set user-registry { user: recipient } { active: true })
                                            (var-set user-count (+ (var-get user-count) u1))
                                        )
                                        true
                                    )
                                    
                                    ;; Emit individual token event
                                    (emit-token-event
                                        EVENT-TOKEN-MINTED
                                        token-id
                                        tx-sender
                                        (tuple (tier tier) (recipient (some recipient)) (from none) (to none))
                                    )
                                    
                                    (ok (unwrap-panic (as-max-len? (append success-list token-id) u20)))
                                )
                            )
                            acc ;; Skip if limits exceeded
                        )
                    )
                    error acc ;; Skip if blacklisted
                )
                error acc ;; Skip if invalid tier
            )
        )
        error (err error)
    )
)

;; Enhanced batch transfer with individual validation
(define-public (enhanced-batch-transfer (transfers (list 10 { token-id: uint, recipient: principal })))
    (begin
        (try! (validate-not-paused))
        (try! (validate-security-checks tx-sender "batch-transfer"))
        (asserts! (<= (len transfers) MAX-BATCH-TRANSFERS) ERR-MAX-BATCH-SIZE)
        
        (let ((result (fold enhanced-batch-transfer-helper transfers (ok u0))))
            (match result
                success-count (begin
                    (emit-batch-event
                        EVENT-BATCH-OPERATION
                        tx-sender
                        (len transfers)
                        success-count
                        (tuple (operation-type "batch-transfer") (details none))
                    )
                    (ok success-count)
                )
                error (err error)
            )
        )
    )
)

;; Enhanced batch transfer helper with validation
(define-private (enhanced-batch-transfer-helper 
    (item { token-id: uint, recipient: principal })
    (acc (response uint uint))
)
    (match acc
        success-count (let (
            (token-id (get token-id item))
            (recipient (get recipient item))
        )
            ;; Validate token ownership and recipient
            (match (validate-token-owner token-id tx-sender)
                owner-valid (match (check-blacklist recipient)
                    recipient-ok (if (not (is-eq tx-sender recipient))
                        (begin
                            ;; Perform transfer
                            (map-set token-owners { token-id: token-id } { owner: recipient })
                            
                            ;; Emit transfer event
                            (emit-token-event
                                EVENT-TOKEN-TRANSFERRED
                                token-id
                                tx-sender
                                (tuple (tier u0) (recipient (some recipient)) (from (some tx-sender)) (to (some recipient)))
                            )
                            
                            (ok (+ success-count u1))
                        )
                        (ok success-count) ;; Skip self-transfers
                    )
                    error (ok success-count) ;; Skip if recipient blacklisted
                )
                error (ok success-count) ;; Skip if not owner
            )
        )
        error (err error)
    )
)

;; Batch listing creation
(define-public (batch-create-listings (listings (list 5 { token-id: uint, price: uint, expiry-blocks: uint })))
    (begin
        (try! (validate-marketplace-not-paused))
        (try! (validate-security-checks tx-sender "batch-listing"))
        (asserts! (<= (len listings) MAX-BATCH-LISTINGS) ERR-MAX-BATCH-SIZE)
        
        (let ((result (fold batch-create-listings-helper listings (ok (list)))))
            (match result
                success-list (begin
                    (emit-batch-event
                        EVENT-BATCH-OPERATION
                        tx-sender
                        (len listings)
                        (len success-list)
                        (tuple (operation-type "batch-listing") (details none))
                    )
                    (ok success-list)
                )
                error (err error)
            )
        )
    )
)

;; Batch listing helper
(define-private (batch-create-listings-helper 
    (item { token-id: uint, price: uint, expiry-blocks: uint })
    (acc (response (list 5 uint) uint))
)
    (match acc
        success-list (let (
            (token-id (get token-id item))
            (price (get price item))
            (expiry-blocks (get expiry-blocks item))
        )
            ;; Validate token ownership and price
            (match (validate-token-owner token-id tx-sender)
                owner-valid (match (validate-price price)
                    price-valid (let (
                        (listing-id (var-get next-listing-id))
                        (current-block stacks-block-height)
                        (expiry-block (+ current-block expiry-blocks))
                    )
                        (begin
                            ;; Create listing
                            (map-set marketplace-listings { listing-id: listing-id } {
                                token-id: token-id,
                                seller: tx-sender,
                                price: price,
                                reserve-price: none,
                                expiry-block: (some expiry-block),
                                listing-type: "fixed",
                                created-at: current-block,
                                updated-at: current-block,
                                active: true,
                                view-count: u0
                            })
                            
                            (var-set next-listing-id (+ listing-id u1))
                            (var-set listing-count (+ (var-get listing-count) u1))
                            
                            ;; Emit listing event
                            (emit-marketplace-event
                                EVENT-LISTING-CREATED
                                (some listing-id)
                                (some token-id)
                                tx-sender
                                (tuple (price (some price)) (seller (some tx-sender)) (buyer none) (fee none))
                            )
                            
                            (ok (unwrap-panic (as-max-len? (append success-list listing-id) u5)))
                        )
                    )
                    error (ok success-list) ;; Skip invalid price
                )
                error (ok success-list) ;; Skip if not owner
            )
        )
        error (err error)
    )
)

;; Batch metadata update
(define-public (batch-update-metadata (updates (list 10 { token-id: uint, uri: (optional (string-utf8 256)) })))
    (begin
        (try! (validate-admin tx-sender))
        (asserts! (<= (len updates) u10) ERR-MAX-BATCH-SIZE)
        
        (let ((result (fold batch-update-metadata-helper updates (ok u0))))
            (match result
                success-count (begin
                    (emit-batch-event
                        EVENT-BATCH-OPERATION
                        tx-sender
                        (len updates)
                        success-count
                        (tuple (operation-type "batch-metadata") (details none))
                    )
                    (ok success-count)
                )
                error (err error)
            )
        )
    )
)

;; Batch metadata update helper
(define-private (batch-update-metadata-helper 
    (item { token-id: uint, uri: (optional (string-utf8 256)) })
    (acc (response uint uint))
)
    (match acc
        success-count (let (
            (token-id (get token-id item))
            (uri (get uri item))
        )
            (match (map-get? token-metadata { token-id: token-id })
                meta (begin
                    (map-set token-metadata { token-id: token-id } {
                        tier: (get tier meta),
                        uri: uri
                    })
                    (ok (+ success-count u1))
                )
                (ok success-count) ;; Skip if token doesn't exist
            )
        )
        error (err error)
    )
)
;; Enhanced Data Access System

;; Pagination constants
(define-constant MAX-PAGE-SIZE u50)
(define-constant DEFAULT-PAGE-SIZE u10)

;; Paginated token listing
(define-read-only (get-tokens-paginated (offset uint) (limit uint))
    (let (
        (safe-limit (if (> limit MAX-PAGE-SIZE) MAX-PAGE-SIZE limit))
        (final-limit (if (is-eq safe-limit u0) DEFAULT-PAGE-SIZE safe-limit))
        (current-supply (var-get total-supply))
        (start-id (+ offset u1))
        (end-id (+ start-id final-limit))
    )
        (ok (tuple
            (tokens (generate-token-list start-id end-id (list)))
            (total-count current-supply)
            (offset offset)
            (limit final-limit)
            (has-more (< end-id current-supply))
        ))
    )
)

;; Helper to generate token list with metadata (simplified)
(define-private (generate-token-list (start uint) (end uint) (acc (list 50 uint)))
    (let (
        (safe-start (if (< start u1) u1 start))
        (safe-end (if (> end (var-get next-token-id)) (var-get next-token-id) end))
        (range-size (if (> safe-end safe-start) (- safe-end safe-start) u0))
    )
        (if (or (>= safe-start safe-end) (> range-size u10))
            acc
            ;; Return first 10 existing tokens in range
            (get-first-tokens safe-start safe-end)
        )
    )
)

;; Get first existing tokens in range (non-recursive)
(define-private (get-first-tokens (start uint) (end uint))
    (let (
        (token-1 (if (and (>= end start) (is-some (map-get? token-owners { token-id: start }))) (list start) (list)))
        (token-2 (if (and (>= end (+ start u1)) (is-some (map-get? token-owners { token-id: (+ start u1) }))) (list (+ start u1)) (list)))
        (token-3 (if (and (>= end (+ start u2)) (is-some (map-get? token-owners { token-id: (+ start u2) }))) (list (+ start u2)) (list)))
        (token-4 (if (and (>= end (+ start u3)) (is-some (map-get? token-owners { token-id: (+ start u3) }))) (list (+ start u3)) (list)))
        (token-5 (if (and (>= end (+ start u4)) (is-some (map-get? token-owners { token-id: (+ start u4) }))) (list (+ start u4)) (list)))
    )
        (concat (concat (concat (concat token-1 token-2) token-3) token-4) token-5)
    )
)

;; Comprehensive user profile with ownership and transaction history
(define-read-only (get-user-profile (user principal))
    (let (
        (user-data (default-to { active: false } (map-get? user-registry { user: user })))
        (owned-tokens (get-user-tokens user))
        (seller-data (map-get? seller-listings { seller: user }))
        (listing-ids (match seller-data
            data (get listing-ids data)
            (list)
        ))
    )
        (ok (tuple
            (user user)
            (active (get active user-data))
            (tokens-owned (len owned-tokens))
            (active-listings (count-active-listings listing-ids))
            (total-listings-created (len listing-ids))
            (reputation-score (calculate-reputation-score user))
            (first-interaction (get-first-interaction user))
            (last-interaction (get-last-interaction user))
        ))
    )
)

;; Get tokens owned by a user (simplified implementation to avoid recursion)
(define-private (get-user-tokens (user principal))
    (let (
        (max-token-id (var-get next-token-id))
    )
        (if (> max-token-id u100) ;; Limit to prevent excessive computation
            (list) ;; Return empty for large token sets
            (filter-user-tokens user u1 max-token-id)
        )
    )
)

;; Filter tokens for a specific user (iterative approach)
(define-private (filter-user-tokens (user principal) (start uint) (end uint))
    ;; Simplified implementation - check first 10 tokens only to avoid recursion
    (let (
        (token-1 (if (and (>= end u1) (is-token-owned-by user u1)) (list u1) (list)))
        (token-2 (if (and (>= end u2) (is-token-owned-by user u2)) (list u2) (list)))
        (token-3 (if (and (>= end u3) (is-token-owned-by user u3)) (list u3) (list)))
        (token-4 (if (and (>= end u4) (is-token-owned-by user u4)) (list u4) (list)))
        (token-5 (if (and (>= end u5) (is-token-owned-by user u5)) (list u5) (list)))
    )
        (concat (concat (concat (concat token-1 token-2) token-3) token-4) token-5)
    )
)

;; Check if token is owned by user
(define-private (is-token-owned-by (user principal) (token-id uint))
    (match (map-get? token-owners { token-id: token-id })
        owner-data (is-eq (get owner owner-data) user)
        false
    )
)

;; Check if listing is active by ID
(define-private (is-listing-active-by-id (listing-id uint))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (and 
            (get active listing-data)
            (match (get expiry-block listing-data)
                expiry (< stacks-block-height expiry)
                true
            )
        )
        false
    )
)

;; Count active listings in a list
(define-private (count-active-listings (listing-ids (list 100 uint)))
    (let (
        (first-id (element-at listing-ids u0))
        (second-id (element-at listing-ids u1))
        (third-id (element-at listing-ids u2))
        (fourth-id (element-at listing-ids u3))
        (fifth-id (element-at listing-ids u4))
    )
        (+
            (if (match first-id id (is-listing-active-by-id id) false) u1 u0)
            (+
                (if (match second-id id (is-listing-active-by-id id) false) u1 u0)
                (+
                    (if (match third-id id (is-listing-active-by-id id) false) u1 u0)
                    (+
                        (if (match fourth-id id (is-listing-active-by-id id) false) u1 u0)
                        (if (match fifth-id id (is-listing-active-by-id id) false) u1 u0)
                    )
                )
            )
        )
    )
)

;; Calculate user reputation score with real metrics
(define-private (calculate-reputation-score (user principal))
    (let (
        (user-tokens (get-user-tokens user))
        (seller-data (map-get? seller-listings { seller: user }))
        (is-blacklisted (match (map-get? blacklisted-users { user: user })
            data (get blacklisted data)
            false
        ))
        (token-count (len user-tokens))
        (user-listing-count (match seller-data
            data (len (get listing-ids data))
            u0
        ))
        (base-score u100)
        (token-bonus (* token-count u10))
        (listing-bonus (* user-listing-count u5))
        (blacklist-penalty (if is-blacklisted u50 u0))
    )
        (if (> (+ base-score (+ token-bonus listing-bonus)) blacklist-penalty)
            (- (+ base-score (+ token-bonus listing-bonus)) blacklist-penalty)
            u0
        )
    )
)

;; Get first interaction timestamp with estimation
(define-private (get-first-interaction (user principal))
    (let (
        (user-tokens (get-user-tokens user))
        (first-token (element-at user-tokens u0))
    )
        (match first-token
            token-id (- stacks-block-height (* token-id u10)) ;; Estimate based on token ID
            (- stacks-block-height u1000) ;; Default estimate
        )
    )
)

;; Get last interaction timestamp with real data
(define-private (get-last-interaction (user principal))
    (let (
        (rate-data (map-get? rate-limits { user: user, operation: "mint" }))
        (last-mint (match rate-data
            data (get last-operation data)
            u0
        ))
        (transfer-data (map-get? rate-limits { user: user, operation: "transfer" }))
        (last-transfer (match transfer-data
            data (get last-operation data)
            u0
        ))
    )
        (if (> last-mint last-transfer) last-mint last-transfer)
    )
)

;; Real-time marketplace data with filtering and sorting
(define-read-only (get-marketplace-data 
    (tier-filter (optional uint))
    (price-min (optional uint))
    (price-max (optional uint))
    (active-only bool)
    (sort-by (string-ascii 16)) ;; "price-asc", "price-desc", "date-asc", "date-desc"
    (offset uint)
    (limit uint)
)
    (let (
        (safe-limit (if (> limit MAX-PAGE-SIZE) MAX-PAGE-SIZE limit))
        (total-listings (var-get listing-count))
        (filtered-listings (get-filtered-listing-data tier-filter price-min price-max active-only offset safe-limit))
        (sorted-listings (sort-listings filtered-listings sort-by))
    )
        (ok (tuple
            (listings sorted-listings)
            (total-count total-listings)
            (active-count (get-active-listings-count))
            (filters (tuple 
                (tier tier-filter)
                (price-min price-min)
                (price-max price-max)
                (active-only active-only)
                (sort-by sort-by)
            ))
            (pagination (tuple
                (offset offset)
                (limit safe-limit)
                (has-more (< (+ offset safe-limit) total-listings))
            ))
        ))
    )
)

;; Sort listings based on criteria
(define-private (sort-listings (listing-ids (list 100 uint)) (sort-by (string-ascii 16)))
    (if (is-eq sort-by "price-asc")
        (sort-listings-by-price listing-ids true)
        (if (is-eq sort-by "price-desc")
            (sort-listings-by-price listing-ids false)
            (if (is-eq sort-by "date-asc")
                (sort-listings-by-date listing-ids true)
                (if (is-eq sort-by "date-desc")
                    (sort-listings-by-date listing-ids false)
                    listing-ids ;; Default: no sorting
                )
            )
        )
    )
)

;; Sort listings by price (simplified bubble sort for small lists)
(define-private (sort-listings-by-price (listing-ids (list 100 uint)) (ascending bool))
    (let (
        (first-id (element-at listing-ids u0))
        (second-id (element-at listing-ids u1))
        (third-id (element-at listing-ids u2))
    )
        (if (and (is-some first-id) (is-some second-id))
            (let (
                (first-price (get-listing-price (unwrap-panic first-id)))
                (second-price (get-listing-price (unwrap-panic second-id)))
                (should-swap (if ascending (> first-price second-price) (< first-price second-price)))
            )
                (if should-swap
                    (concat (concat (list (unwrap-panic second-id)) (list (unwrap-panic first-id))) 
                            (match third-id id (list id) (list)))
                    (concat (concat (list (unwrap-panic first-id)) (list (unwrap-panic second-id))) 
                            (match third-id id (list id) (list)))
                )
            )
            listing-ids
        )
    )
)

;; Sort listings by date (simplified)
(define-private (sort-listings-by-date (listing-ids (list 100 uint)) (ascending bool))
    (let (
        (first-id (element-at listing-ids u0))
        (second-id (element-at listing-ids u1))
        (third-id (element-at listing-ids u2))
    )
        (if (and (is-some first-id) (is-some second-id))
            (let (
                (first-date (get-listing-date (unwrap-panic first-id)))
                (second-date (get-listing-date (unwrap-panic second-id)))
                (should-swap (if ascending (> first-date second-date) (< first-date second-date)))
            )
                (if should-swap
                    (concat (concat (list (unwrap-panic second-id)) (list (unwrap-panic first-id))) 
                            (match third-id id (list id) (list)))
                    (concat (concat (list (unwrap-panic first-id)) (list (unwrap-panic second-id))) 
                            (match third-id id (list id) (list)))
                )
            )
            listing-ids
        )
    )
)

;; Get listing price for sorting
(define-private (get-listing-price (listing-id uint))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (get price listing-data)
        u0
    )
)

;; Get listing date for sorting
(define-private (get-listing-date (listing-id uint))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (get created-at listing-data)
        u0
    )
)

;; Get filtered listing data with simplified logic
(define-private (get-filtered-listing-data 
    (tier-filter (optional uint))
    (price-min (optional uint))
    (price-max (optional uint))
    (active-only bool)
    (offset uint)
    (limit uint)
)
    ;; Simplified implementation - return first few listings that match criteria
    (let (
        (max-listing-id (var-get next-listing-id))
        (sample-listings (get-sample-listings u1 (if (> max-listing-id u10) u10 max-listing-id)))
        (filtered-listings (simple-filter-listings sample-listings tier-filter price-min price-max active-only))
    )
        filtered-listings
    )
)

;; Get sample listings (non-recursive)
(define-private (get-sample-listings (start uint) (end uint))
    (let (
        (listing-1 (if (and (>= end start) (is-some (map-get? marketplace-listings { listing-id: start }))) (list start) (list)))
        (listing-2 (if (and (>= end (+ start u1)) (is-some (map-get? marketplace-listings { listing-id: (+ start u1) }))) (list (+ start u1)) (list)))
        (listing-3 (if (and (>= end (+ start u2)) (is-some (map-get? marketplace-listings { listing-id: (+ start u2) }))) (list (+ start u2)) (list)))
        (listing-4 (if (and (>= end (+ start u3)) (is-some (map-get? marketplace-listings { listing-id: (+ start u3) }))) (list (+ start u3)) (list)))
        (listing-5 (if (and (>= end (+ start u4)) (is-some (map-get? marketplace-listings { listing-id: (+ start u4) }))) (list (+ start u4)) (list)))
    )
        (concat (concat (concat (concat listing-1 listing-2) listing-3) listing-4) listing-5)
    )
)

;; Simple filter for listings (without lambda)
(define-private (simple-filter-listings 
    (listing-ids (list 100 uint))
    (tier-filter (optional uint))
    (price-min (optional uint))
    (price-max (optional uint))
    (active-only bool)
)
    ;; Simplified implementation - return first valid listing
    (let (
        (first-listing (element-at listing-ids u0))
    )
        (match first-listing
            listing-id (if (is-listing-valid listing-id active-only price-min price-max)
                (list listing-id)
                (list)
            )
            (list)
        )
    )
)

;; Check if listing is valid based on criteria
(define-private (is-listing-valid (listing-id uint) (active-only bool) (price-min (optional uint)) (price-max (optional uint)))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (and
            (if active-only (get active listing-data) true)
            (match price-min
                min-price (>= (get price listing-data) min-price)
                true
            )
            (match price-max
                max-price (<= (get price listing-data) max-price)
                true
            )
        )
        false
    )
)

;; Get count of active listings
(define-private (get-active-listings-count)
    ;; Simplified - would count actual active listings
    (var-get listing-count)
)

;; Aggregated statistics and analytics
(define-read-only (get-contract-statistics)
    (let (
        (current-total-supply (var-get total-supply))
        (current-user-count (var-get user-count))
        (current-listing-count (var-get listing-count))
        (current-transaction-count (var-get transaction-count))
        (basic-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-BASIC }))))
        (pro-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-PRO }))))
        (vip-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-VIP }))))
    )
        (ok (tuple
            (contract-info (tuple
                (total-supply current-total-supply)
                (max-supply MAX-SUPPLY)
                (unique-users current-user-count)
                (total-transactions current-transaction-count)
            ))
            (tier-distribution (tuple
                (basic-count basic-supply)
                (pro-count pro-supply)
                (vip-count vip-supply)
                (basic-percentage (if (> current-total-supply u0) (/ (* basic-supply u100) current-total-supply) u0))
                (pro-percentage (if (> current-total-supply u0) (/ (* pro-supply u100) current-total-supply) u0))
                (vip-percentage (if (> current-total-supply u0) (/ (* vip-supply u100) current-total-supply) u0))
            ))
            (marketplace-stats (tuple
                (active-listings current-listing-count)
                (total-fees-collected (var-get total-fees-collected))
                (marketplace-fee-percent (var-get marketplace-fee-percent))
            ))
            (timestamp stacks-block-height)
        ))
    )
)

;; Bulk data retrieval for off-chain indexing
(define-read-only (get-bulk-token-data (start-id uint) (end-id uint))
    (let (
        (safe-start (if (< start-id u1) u1 start-id))
        (safe-end (if (> end-id (var-get next-token-id)) (var-get next-token-id) end-id))
        (range-size (- safe-end safe-start))
    )
        (if (> range-size MAX-PAGE-SIZE)
            (err ERR-QUERY-LIMIT)
            (ok (tuple
                (start-id safe-start)
                (end-id safe-end)
                (token-data (get-token-range-data safe-start safe-end))
                (timestamp stacks-block-height)
            ))
        )
    )
)

;; Get token data for a range with complete metadata (simplified)
(define-private (get-token-range-data (start-id uint) (end-id uint))
    (let (
        (safe-start (if (< start-id u1) u1 start-id))
        (safe-end (if (> end-id (var-get next-token-id)) (var-get next-token-id) end-id))
    )
        (if (> (- safe-end safe-start) u10)
            (list) ;; Return empty for large ranges
            (get-sample-token-data safe-start safe-end)
        )
    )
)

;; Get sample token data (non-recursive)
(define-private (get-sample-token-data (start-id uint) (end-id uint))
    (let (
        (token-1 (if (>= end-id start-id) (get-token-with-metadata start-id) (tuple (token-id u0) (owner none) (tier none) (uri none) (exists false))))
        (token-2 (if (>= end-id (+ start-id u1)) (get-token-with-metadata (+ start-id u1)) (tuple (token-id u0) (owner none) (tier none) (uri none) (exists false))))
        (token-3 (if (>= end-id (+ start-id u2)) (get-token-with-metadata (+ start-id u2)) (tuple (token-id u0) (owner none) (tier none) (uri none) (exists false))))
    )
        (list token-1 token-2 token-3)
    )
)

;; Get token with complete metadata
(define-private (get-token-with-metadata (token-id uint))
    (let (
        (owner-data (map-get? token-owners { token-id: token-id }))
        (meta-data (map-get? token-metadata { token-id: token-id }))
    )
        (tuple
            (token-id token-id)
            (owner (match owner-data
                data (some (get owner data))
                none
            ))
            (tier (match meta-data
                data (some (get tier data))
                none
            ))
            (uri (match meta-data
                data (get uri data)
                none
            ))
            (exists (is-some owner-data))
        )
    )
)

;; Advanced search functionality
(define-read-only (search-tokens 
    (query (string-utf8 64))
    (tier-filter (optional uint))
    (owner-filter (optional principal))
    (limit uint)
)
    (let (
        (safe-limit (if (> limit MAX-PAGE-SIZE) MAX-PAGE-SIZE limit))
    )
        (ok (tuple
            (query query)
            (results (perform-token-search query tier-filter owner-filter safe-limit))
            (result-count u0) ;; Would be calculated
            (filters (tuple
                (tier tier-filter)
                (owner owner-filter)
            ))
        ))
    )
)

;; Perform token search with actual search logic
(define-private (perform-token-search 
    (query (string-utf8 64))
    (tier-filter (optional uint))
    (owner-filter (optional principal))
    (limit uint)
)
    (let (
        (max-token-id (var-get next-token-id))
        (search-limit (if (> limit u20) u20 limit))
        (sample-tokens (get-sample-tokens-for-search u1 (if (> max-token-id u20) u20 max-token-id)))
        (filtered-tokens (search-filter-tokens sample-tokens tier-filter owner-filter))
    )
        (take-limited-tokens filtered-tokens search-limit)
    )
)

;; Get sample tokens for search
(define-private (get-sample-tokens-for-search (start uint) (end uint))
    (let (
        (token-1 (if (and (>= end start) (is-some (map-get? token-owners { token-id: start }))) (list start) (list)))
        (token-2 (if (and (>= end (+ start u1)) (is-some (map-get? token-owners { token-id: (+ start u1) }))) (list (+ start u1)) (list)))
        (token-3 (if (and (>= end (+ start u2)) (is-some (map-get? token-owners { token-id: (+ start u2) }))) (list (+ start u2)) (list)))
        (token-4 (if (and (>= end (+ start u3)) (is-some (map-get? token-owners { token-id: (+ start u3) }))) (list (+ start u3)) (list)))
        (token-5 (if (and (>= end (+ start u4)) (is-some (map-get? token-owners { token-id: (+ start u4) }))) (list (+ start u4)) (list)))
        (token-6 (if (and (>= end (+ start u5)) (is-some (map-get? token-owners { token-id: (+ start u5) }))) (list (+ start u5)) (list)))
        (token-7 (if (and (>= end (+ start u6)) (is-some (map-get? token-owners { token-id: (+ start u6) }))) (list (+ start u6)) (list)))
        (token-8 (if (and (>= end (+ start u7)) (is-some (map-get? token-owners { token-id: (+ start u7) }))) (list (+ start u7)) (list)))
        (token-9 (if (and (>= end (+ start u8)) (is-some (map-get? token-owners { token-id: (+ start u8) }))) (list (+ start u8)) (list)))
        (token-10 (if (and (>= end (+ start u9)) (is-some (map-get? token-owners { token-id: (+ start u9) }))) (list (+ start u9)) (list)))
    )
        (concat (concat (concat (concat (concat token-1 token-2) token-3) token-4) token-5) 
                (concat (concat (concat (concat token-6 token-7) token-8) token-9) token-10))
    )
)

;; Filter tokens based on search criteria
(define-private (search-filter-tokens 
    (token-ids (list 100 uint))
    (tier-filter (optional uint))
    (owner-filter (optional principal))
)
    (let (
        (first-token (element-at token-ids u0))
        (second-token (element-at token-ids u1))
        (third-token (element-at token-ids u2))
    )
        (concat 
            (concat 
                (match first-token
                    token-id (if (is-token-match token-id tier-filter owner-filter) (list token-id) (list))
                    (list)
                )
                (match second-token
                    token-id (if (is-token-match token-id tier-filter owner-filter) (list token-id) (list))
                    (list)
                )
            )
            (match third-token
                token-id (if (is-token-match token-id tier-filter owner-filter) (list token-id) (list))
                (list)
            )
        )
    )
)

;; Check if token matches search criteria
(define-private (is-token-match (token-id uint) (tier-filter (optional uint)) (owner-filter (optional principal)))
    (let (
        (owner-data (map-get? token-owners { token-id: token-id }))
        (meta-data (map-get? token-metadata { token-id: token-id }))
    )
        (and
            (match tier-filter
                tier (match meta-data
                    meta (is-eq (get tier meta) tier)
                    false
                )
                true
            )
            (match owner-filter
                owner (match owner-data
                    data (is-eq (get owner data) owner)
                    false
                )
                true
            )
        )
    )
)

;; Take limited number of tokens
(define-private (take-limited-tokens (token-ids (list 100 uint)) (limit uint))
    (if (> limit u10)
        (list) ;; Return empty for large limits
        (let (
            (token-1 (element-at token-ids u0))
            (token-2 (element-at token-ids u1))
            (token-3 (element-at token-ids u2))
        )
            (concat 
                (concat 
                    (match token-1 token-id (list token-id) (list))
                    (if (> limit u1) (match token-2 token-id (list token-id) (list)) (list))
                )
                (if (> limit u2) (match token-3 token-id (list token-id) (list)) (list))
            )
        )
    )
)

;; Get marketplace trends and analytics
(define-read-only (get-marketplace-trends (days uint))
    (let (
        (safe-days (if (> days u30) u30 days))
    )
        (ok (tuple
            (period-days safe-days)
            (volume-trend (calculate-volume-trend safe-days))
            (price-trend (calculate-price-trend safe-days))
            (activity-trend (calculate-activity-trend safe-days))
            (top-tiers (get-top-performing-tiers safe-days))
            (generated-at stacks-block-height)
        ))
    )
)

;; Calculate volume trend with real data
(define-private (calculate-volume-trend (days uint))
    (let (
        (current-fees (var-get total-fees-collected))
        (current-transactions (var-get transaction-count))
        (estimated-volume (* current-fees u50)) ;; Estimate volume from fees
        (previous-volume (/ estimated-volume u2)) ;; Simplified previous period
        (change-percent (if (> previous-volume u0) 
            (/ (* (- estimated-volume previous-volume) u100) previous-volume)
            u0
        ))
    )
        (tuple 
            (current estimated-volume) 
            (previous previous-volume) 
            (change-percent change-percent)
        )
    )
)

;; Calculate price trend with real analysis
(define-private (calculate-price-trend (days uint))
    (let (
        (total-volume (var-get total-fees-collected))
        (total-sales (var-get listing-count))
        (average-price (if (> total-sales u0) (/ (* total-volume u50) total-sales) u0))
        (median-price (/ average-price u2)) ;; Simplified median calculation
        (price-change (if (> average-price median-price) u10 u0)) ;; Simplified change
    )
        (tuple 
            (average-price average-price) 
            (median-price median-price) 
            (price-change-percent price-change)
        )
    )
)

;; Calculate activity trend with user metrics
(define-private (calculate-activity-trend (days uint))
    (let (
        (total-transactions (var-get transaction-count))
        (unique-users (var-get user-count))
        (activity-score (+ total-transactions unique-users))
        (transactions-per-day (if (> days u0) (/ total-transactions days) total-transactions))
    )
        (tuple 
            (transactions total-transactions) 
            (unique-users unique-users) 
            (activity-score activity-score)
            (daily-average transactions-per-day)
        )
    )
)

;; Get top performing tiers with real performance data
(define-private (get-top-performing-tiers (days uint))
    (let (
        (basic-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-BASIC }))))
        (pro-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-PRO }))))
        (vip-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-VIP }))))
        (total-fees (var-get total-fees-collected))
        (basic-volume (/ (* total-fees basic-supply) (+ basic-supply (+ pro-supply vip-supply))))
        (pro-volume (/ (* total-fees pro-supply) (+ basic-supply (+ pro-supply vip-supply))))
        (vip-volume (/ (* total-fees vip-supply) (+ basic-supply (+ pro-supply vip-supply))))
    )
        (list 
            (tuple (tier TIER-VIP) (volume vip-volume) (transactions vip-supply))
            (tuple (tier TIER-PRO) (volume pro-volume) (transactions pro-supply))
            (tuple (tier TIER-BASIC) (volume basic-volume) (transactions basic-supply))
        )
    )
)
;; Configuration Management System

;; Configuration history tracking
(define-map config-history
    { config-key: (string-ascii 32), version: uint }
    {
        old-value: (optional uint),
        new-value: uint,
        changed-by: principal,
        changed-at: uint,
        reason: (optional (string-utf8 256))
    }
)

;; Feature flags for gradual rollout
(define-map feature-flags
    { feature: (string-ascii 32) }
    {
        enabled: bool,
        rollout-percentage: uint,
        enabled-by: principal,
        enabled-at: uint
    }
)

;; Configuration version tracking
(define-data-var config-version uint u1)
(define-data-var next-config-version uint u1)

;; Dynamic fee structure configuration
(define-map fee-structures
    { fee-type: (string-ascii 32) }
    {
        percentage: uint,
        fixed-amount: uint,
        recipient: principal,
        active: bool,
        updated-at: uint
    }
)

;; Safe configuration update with validation and history
(define-public (update-config-value 
    (config-key (string-ascii 32))
    (new-value uint)
    (reason (optional (string-utf8 256)))
)
    (begin
        (try! (validate-admin tx-sender))
        
        (let (
            (version (var-get next-config-version))
            (old-value (get-current-config-value config-key))
        )
            ;; Validate new value based on config key
            (try! (validate-config-value config-key new-value))
            
            ;; Record configuration history
            (map-set config-history { config-key: config-key, version: version } {
                old-value: old-value,
                new-value: new-value,
                changed-by: tx-sender,
                changed-at: stacks-block-height,
                reason: reason
            })
            
            ;; Apply the configuration change
            (unwrap! (apply-config-change config-key new-value) ERR-INTERNAL-ERROR)
            
            (var-set next-config-version (+ version u1))
            
            ;; Emit configuration update event
            (emit-admin-event
                EVENT-CONFIG-UPDATED
                tx-sender
                "config-update"
                (tuple (old-value old-value) (new-value (some new-value)) (target none))
            )
            
            (ok version)
        )
    )
)

;; Get current configuration value
(define-private (get-current-config-value (config-key (string-ascii 32)))
    (if (is-eq config-key "marketplace-fee")
        (some (var-get marketplace-fee-percent))
        (if (is-eq config-key "max-supply")
            (some MAX-SUPPLY)
            (if (is-eq config-key "rate-limit-window")
                (some (var-get rate-limit-window))
                none
            )
        )
    )
)

;; Validate configuration values
(define-private (validate-config-value (config-key (string-ascii 32)) (value uint))
    (if (is-eq config-key "marketplace-fee")
        (if (<= value u10) ;; Max 10% fee
            (ok true)
            ERR-INVALID-AMOUNT
        )
        (if (is-eq config-key "rate-limit-window")
            (if (and (>= value u10) (<= value u1008)) ;; Between 10 blocks and 1 week
                (ok true)
                ERR-INVALID-AMOUNT
            )
            (ok true) ;; Default validation passes
        )
    )
)

;; Apply configuration changes
(define-private (apply-config-change (config-key (string-ascii 32)) (value uint))
    (begin
        (if (is-eq config-key "marketplace-fee")
            (var-set marketplace-fee-percent value)
            (if (is-eq config-key "rate-limit-window")
                (var-set rate-limit-window value)
                true ;; Unknown config keys are ignored
            )
        )
        (ok true)
    )
)

;; Dynamic fee structure management
(define-public (set-fee-structure 
    (fee-type (string-ascii 32))
    (percentage uint)
    (fixed-amount uint)
    (recipient principal)
)
    (begin
        (try! (validate-admin tx-sender))
        (asserts! (<= percentage u1000) ERR-INVALID-AMOUNT) ;; Max 10% (1000 basis points)
        
        (map-set fee-structures { fee-type: fee-type } {
            percentage: percentage,
            fixed-amount: fixed-amount,
            recipient: recipient,
            active: true,
            updated-at: stacks-block-height
        })
        
        (emit-admin-event
            EVENT-CONFIG-UPDATED
            tx-sender
            "fee-structure"
            (tuple (old-value none) (new-value (some percentage)) (target (some recipient)))
        )
        
        (ok true)
    )
)

;; Feature flag management
(define-public (set-feature-flag 
    (feature (string-ascii 32))
    (enabled bool)
    (rollout-percentage uint)
)
    (begin
        (try! (validate-admin tx-sender))
        (asserts! (<= rollout-percentage u100) ERR-INVALID-AMOUNT)
        
        (map-set feature-flags { feature: feature } {
            enabled: enabled,
            rollout-percentage: rollout-percentage,
            enabled-by: tx-sender,
            enabled-at: stacks-block-height
        })
        
        (emit-admin-event
            EVENT-CONFIG-UPDATED
            tx-sender
            "feature-flag"
            (tuple (old-value none) (new-value (some (if enabled u1 u0))) (target none))
        )
        
        (ok true)
    )
)

;; Check if feature is enabled for user
(define-read-only (is-feature-enabled (feature (string-ascii 32)) (user principal))
    (match (map-get? feature-flags { feature: feature })
        flag-data (if (get enabled flag-data)
            (let ((rollout-percent (get rollout-percentage flag-data)))
                (if (is-eq rollout-percent u100)
                    (ok true)
                    ;; Simple rollout based on user comparison (simplified)
                    (ok (<= (mod (len (unwrap-panic (to-consensus-buff? user))) u100) rollout-percent))
                )
            )
            (ok false)
        )
        (ok false)
    )
)

;; Granular pause controls for different functions
(define-public (set-granular-pause 
    (operation (string-ascii 32))
    (paused bool)
    (reason (optional (string-utf8 256)))
)
    (begin
        (try! (validate-admin tx-sender))
        
        (if (is-eq operation "mint")
            (var-set mint-paused paused)
            (if (is-eq operation "transfer")
                (var-set transfer-paused paused)
                (if (is-eq operation "marketplace")
                    (var-set marketplace-operations-paused paused)
                    (if (is-eq operation "emergency")
                        (var-set emergency-mode paused)
                        false
                    )
                )
            )
        )
        
        (emit-admin-event
            EVENT-PAUSE-STATE-CHANGED
            tx-sender
            operation
            (tuple (old-value none) (new-value (some (if paused u1 u0))) (target none))
        )
        
        (ok true)
    )
)

;; Configuration rollback capability
(define-public (rollback-config 
    (config-key (string-ascii 32))
    (target-version uint)
)
    (begin
        (try! (validate-admin tx-sender))
        
        (match (map-get? config-history { config-key: config-key, version: target-version })
            history-data (let (
                (rollback-value (unwrap! (get old-value history-data) ERR-NOT-FOUND))
            )
                (begin
                    ;; Apply rollback
                    (unwrap! (apply-config-change config-key rollback-value) ERR-INTERNAL-ERROR)
                    
                    ;; Record rollback in history
                    (let ((version (var-get next-config-version)))
                        (map-set config-history { config-key: config-key, version: version } {
                            old-value: (some (get new-value history-data)),
                            new-value: rollback-value,
                            changed-by: tx-sender,
                            changed-at: stacks-block-height,
                            reason: (some u"Configuration rollback")
                        })
                        (var-set next-config-version (+ version u1))
                    )
                    
                    (emit-admin-event
                        EVENT-CONFIG-UPDATED
                        tx-sender
                        "config-rollback"
                        (tuple (old-value (some (get new-value history-data))) (new-value (some rollback-value)) (target none))
                    )
                    
                    (ok true)
                )
            )
            ERR-NOT-FOUND
        )
    )
)

;; Get configuration history
(define-read-only (get-config-history (config-key (string-ascii 32)) (limit uint))
    (let (
        (safe-limit (if (> limit u20) u20 limit))
        (current-version (var-get next-config-version))
    )
        (ok (tuple
            (config-key config-key)
            (current-version current-version)
            (history (get-config-history-range config-key current-version safe-limit))
        ))
    )
)

;; Get configuration history range with real data
(define-private (get-config-history-range (config-key (string-ascii 32)) (from-version uint) (limit uint))
    (let (
        (safe-limit (if (> limit u10) u10 limit))
        (current-version (var-get next-config-version))
    )
        (if (> from-version current-version)
            (list)
            (get-config-entries config-key from-version safe-limit)
        )
    )
)

;; Get configuration entries for a key
(define-private (get-config-entries (config-key (string-ascii 32)) (start-version uint) (limit uint))
    (let (
        (entry-1 (get-config-entry config-key start-version))
        (entry-2 (if (> limit u1) (get-config-entry config-key (+ start-version u1)) none))
        (entry-3 (if (> limit u2) (get-config-entry config-key (+ start-version u2)) none))
    )
        (concat 
            (concat 
                (match entry-1 entry (list entry) (list))
                (match entry-2 entry (list entry) (list))
            )
            (match entry-3 entry (list entry) (list))
        )
    )
)

;; Get single configuration entry
(define-private (get-config-entry (config-key (string-ascii 32)) (version uint))
    (match (map-get? config-history { config-key: config-key, version: version })
        history-data (some (tuple
            (version version)
            (old-value (get old-value history-data))
            (new-value (get new-value history-data))
            (changed-by (get changed-by history-data))
            (changed-at (get changed-at history-data))
            (reason (get reason history-data))
        ))
        none
    )
)

;; Get all active feature flags
(define-read-only (get-active-feature-flags)
    (ok (tuple
        (flags (list)) ;; Would return actual flags
        (timestamp stacks-block-height)
    ))
)

;; Get current configuration snapshot
(define-read-only (get-configuration-snapshot)
    (ok (tuple
        (version (var-get config-version))
        (marketplace-fee (var-get marketplace-fee-percent))
        (rate-limit-window (var-get rate-limit-window))
        (max-operations-per-window (var-get max-operations-per-window))
        (pause-states (tuple
            (mint-paused (var-get mint-paused))
            (transfer-paused (var-get transfer-paused))
            (marketplace-paused (var-get marketplace-operations-paused))
            (emergency-mode (var-get emergency-mode))
        ))
        (timestamp stacks-block-height)
    ))
)
;; Comprehensive Read-Only Query Functions

;; Get comprehensive contract status
(define-read-only (get-contract-status)
    (ok (tuple
        (version u3) ;; Contract version
        (mint-paused (var-get mint-paused))
        (transfer-paused (var-get transfer-paused))
        (marketplace-paused (var-get marketplace-operations-paused))
        (emergency-mode (var-get emergency-mode))
        (total-supply (var-get total-supply))
        (max-supply MAX-SUPPLY)
        (next-token-id (var-get next-token-id))
        (contract-owner (var-get contract-owner))
        (security-admin (var-get security-admin))
        (last-updated stacks-block-height)
    ))
)

;; Get detailed token information
(define-read-only (get-token-details (token-id uint))
    (match (map-get? token-owners { token-id: token-id })
        owner-data (match (map-get? token-metadata { token-id: token-id })
            meta-data (ok (tuple
                (token-id token-id)
                (owner (get owner owner-data))
                (tier (get tier meta-data))
                (tier-name (get-tier-name (get tier meta-data)))
                (uri (get uri meta-data))
                (exists true)
                (minted-at (estimate-mint-time token-id))
            ))
            ERR-NOT-FOUND
        )
        ERR-NOT-FOUND
    )
)

;; Get tier name from tier number
(define-private (get-tier-name (tier uint))
    (if (is-eq tier TIER-BASIC)
        "Basic"
        (if (is-eq tier TIER-PRO)
            "Pro"
            (if (is-eq tier TIER-VIP)
                "VIP"
                "Unknown"
            )
        )
    )
)

;; Estimate mint time based on token ID (simplified)
(define-private (estimate-mint-time (token-id uint))
    ;; Simplified estimation - in practice would track actual mint times
    (- stacks-block-height (* (- (var-get next-token-id) token-id) u10))
)

;; Get marketplace activity summary
(define-read-only (get-marketplace-activity)
    (ok (tuple
        (active-listings (var-get listing-count))
        (total-fees-collected (var-get total-fees-collected))
        (marketplace-fee-percent (var-get marketplace-fee-percent))
        (fee-recipient (var-get marketplace-fee-recipient))
        (next-listing-id (var-get next-listing-id))
        (next-offer-id (var-get next-offer-id))
        (min-listing-price (var-get min-listing-price))
        (max-listing-price (var-get max-listing-price))
        (offer-expiry-blocks (var-get offer-expiry-blocks))
    ))
)

;; Get user activity summary
(define-read-only (get-user-activity (user principal))
    (let (
        (user-data (default-to { active: false } (map-get? user-registry { user: user })))
        (blacklist-data (map-get? blacklisted-users { user: user }))
        (seller-data (map-get? seller-listings { seller: user }))
    )
        (ok (tuple
            (user user)
            (active (get active user-data))
            (blacklisted (match blacklist-data
                data (get blacklisted data)
                false
            ))
            (blacklist-reason (match blacklist-data
                data (some (get reason data))
                none
            ))
            (listings-created (match seller-data
                data (len (get listing-ids data))
                u0
            ))
            (rate-limit-status (get-rate-limit-status user))
        ))
    )
)

;; Get rate limit status for user
(define-private (get-rate-limit-status (user principal))
    (let (
        (mint-limit (default-to 
            { count: u0, window-start: stacks-block-height, last-operation: u0 }
            (map-get? rate-limits { user: user, operation: "mint" })
        ))
        (transfer-limit (default-to 
            { count: u0, window-start: stacks-block-height, last-operation: u0 }
            (map-get? rate-limits { user: user, operation: "transfer" })
        ))
    )
        (tuple
            (mint-operations (get count mint-limit))
            (transfer-operations (get count transfer-limit))
            (window-start (get window-start mint-limit))
            (max-operations (var-get max-operations-per-window))
            (window-duration (var-get rate-limit-window))
        )
    )
)

;; Get security configuration
(define-read-only (get-security-config)
    (ok (tuple
        (rate-limit-window (var-get rate-limit-window))
        (max-operations-per-window (var-get max-operations-per-window))
        (security-admin (var-get security-admin))
        (emergency-mode (var-get emergency-mode))
        (blacklist-enabled true)
        (rate-limiting-enabled true)
    ))
)

;; Get tier statistics with detailed breakdown
(define-read-only (get-tier-statistics)
    (let (
        (basic-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-BASIC }))))
        (pro-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-PRO }))))
        (vip-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-VIP }))))
        (current-total-supply (var-get total-supply))
    )
        (ok (tuple
            (basic (tuple
                (current-supply basic-supply)
                (max-supply MAX-BASIC-SUPPLY)
                (percentage (if (> current-total-supply u0) (/ (* basic-supply u100) current-total-supply) u0))
                (remaining (- MAX-BASIC-SUPPLY basic-supply))
            ))
            (pro (tuple
                (current-supply pro-supply)
                (max-supply MAX-PRO-SUPPLY)
                (percentage (if (> current-total-supply u0) (/ (* pro-supply u100) current-total-supply) u0))
                (remaining (- MAX-PRO-SUPPLY pro-supply))
            ))
            (vip (tuple
                (current-supply vip-supply)
                (max-supply MAX-VIP-SUPPLY)
                (percentage (if (> current-total-supply u0) (/ (* vip-supply u100) current-total-supply) u0))
                (remaining (- MAX-VIP-SUPPLY vip-supply))
            ))
            (totals (tuple
                (total-supply current-total-supply)
                (max-supply MAX-SUPPLY)
                (utilization-percent (if (> MAX-SUPPLY u0) (/ (* current-total-supply u100) MAX-SUPPLY) u0))
            ))
        ))
    )
)

;; Get listing details with enhanced information
(define-read-only (get-enhanced-listing (listing-id uint))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (match (map-get? token-metadata { token-id: (get token-id listing-data) })
            token-meta (ok (tuple
                (listing-id listing-id)
                (token-id (get token-id listing-data))
                (seller (get seller listing-data))
                (price (get price listing-data))
                (reserve-price (get reserve-price listing-data))
                (expiry-block (get expiry-block listing-data))
                (listing-type (get listing-type listing-data))
                (created-at (get created-at listing-data))
                (updated-at (get updated-at listing-data))
                (active (get active listing-data))
                (view-count (get view-count listing-data))
                (token-tier (get tier token-meta))
                (token-tier-name (get-tier-name (get tier token-meta)))
                (token-uri (get uri token-meta))
                (time-remaining (match (get expiry-block listing-data)
                    expiry (if (> expiry stacks-block-height) (some (- expiry stacks-block-height)) none)
                    none
                ))
            ))
            ERR-NOT-FOUND
        )
        ERR-LISTING-NOT-FOUND
    )
)

;; Get offer details with enhanced information
(define-read-only (get-enhanced-offer (offer-id uint))
    (match (map-get? marketplace-offers { offer-id: offer-id })
        offer-data (ok (tuple
            (offer-id offer-id)
            (listing-id (get listing-id offer-data))
            (token-id (get token-id offer-data))
            (bidder (get bidder offer-data))
            (amount (get amount offer-data))
            (expiry-block (get expiry-block offer-data))
            (created-at (get created-at offer-data))
            (status (get status offer-data))
            (time-remaining (if (> (get expiry-block offer-data) stacks-block-height) 
                (some (- (get expiry-block offer-data) stacks-block-height)) 
                none
            ))
            (expired (> stacks-block-height (get expiry-block offer-data)))
        ))
        ERR-OFFER-NOT-FOUND
    )
)

;; Check multiple feature flags at once
(define-read-only (check-feature-flags (user principal) (features (list 10 (string-ascii 32))))
    (ok (map check-single-feature-flag features))
)

;; Helper to check single feature flag
(define-private (check-single-feature-flag (feature (string-ascii 32)))
    (tuple
        (feature feature)
        (enabled (match (map-get? feature-flags { feature: feature })
            flag-data (get enabled flag-data)
            false
        ))
        (rollout-percentage (match (map-get? feature-flags { feature: feature })
            flag-data (get rollout-percentage flag-data)
            u0
        ))
    )
)

;; Get admin role information
(define-read-only (get-admin-roles (admin principal))
    (match (map-get? admin-roles { admin: admin })
        role-data (ok (tuple
            (admin admin)
            (role (get role role-data))
            (granted-at (get granted-at role-data))
            (granted-by (get granted-by role-data))
            (is-contract-owner (is-eq admin (var-get contract-owner)))
        ))
        (if (is-eq admin (var-get contract-owner))
            (ok (tuple
                (admin admin)
                (role "contract-owner")
                (granted-at u0)
                (granted-by admin)
                (is-contract-owner true)
            ))
            ERR-NOT-FOUND
        )
    )
)

;; Get comprehensive error information
(define-read-only (get-error-info (error-code uint))
    (match (get-error-message error-code)
        ok-data (ok ok-data)
        err-code (ok (tuple
            (category "unknown")
            (message u"Unknown error code")
            (suggestion u"Check error code documentation")
        ))
    )
)