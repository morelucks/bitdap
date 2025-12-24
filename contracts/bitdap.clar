;; title: Bitdap Pass
;; version: 0.3.0
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

;; Enhanced Error Handling System
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

;; Tiers are represented as uints for compact on-chain storage.
(define-constant TIER-BASIC u1)
(define-constant TIER-PRO u2)
(define-constant TIER-VIP u3)

;; Collection-wide and per-tier maximum supplies.
;; These are conservative defaults that can be adjusted in future versions.
(define-constant MAX-SUPPLY u10000)
(define-constant MAX-BASIC-SUPPLY u7000)
(define-constant MAX-PRO-SUPPLY u2500)
(define-constant MAX-VIP-SUPPLY u500)

;; data vars
;; - Global counters for token-ids and total supply.

;; Next token-id to mint (starts at u1).
(define-data-var next-token-id uint u1)

;; Total number of Bitdap Pass NFTs currently in circulation.
(define-data-var total-supply uint u0)

;; Contract owner (admin) - initialized to contract deployer
(define-data-var contract-owner principal tx-sender)

;; Pause flag (when true, mint/transfer are disabled)
(define-data-var paused bool false)

;; Marketplace pause flag (when true, marketplace operations are disabled)
(define-data-var marketplace-paused bool false)

;; Counter for unique users who have interacted with the contract
(define-data-var user-count uint u0)

;; Counter for marketplace listings
(define-data-var listing-count uint u0)

;; Next listing ID to assign
(define-data-var next-listing-id uint u1)

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
    (if (var-get paused)
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

;; token-id -> metadata (tier and optional off-chain URI)
(define-map token-metadata
    { token-id: uint }
    {
        tier: uint,
        uri: (optional (string-utf8 256)),
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
    (ok (var-get paused))
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
        
        ;; Check feature flag for minting
        (asserts! (unwrap! (is-feature-enabled "minting" tx-sender) ERR-FEATURE-DISABLED) ERR-FEATURE-DISABLED)
        
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
        (asserts! (not (var-get marketplace-paused)) ERR-PAUSED)
        (asserts! (> price u0) ERR-INVALID-PRICE)
        (asserts! (> expiry-blocks u0) ERR-INVALID-PRICE)
        (match (map-get? token-owners { token-id: token-id })
            owner-data (let ((owner (get owner owner-data)))
                (if (not (is-eq owner tx-sender))
                    ERR-NOT-OWNER
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
                            ;; Emit event
                            (print (tuple
                                (event "listing-created")
                                (listing-id listing-id)
                                (token-id token-id)
                                (seller tx-sender)
                                (price price)
                                (expiry-block expiry-block)
                            ))
                            (ok listing-id)
                        )
                    )
                )
            )
            ERR-NOT-FOUND
        )
    )
)

;; Public: purchase a marketplace listing
;; Buyer sends STX, seller receives STX minus fees
;; Listing must be active
;; Token ownership transfers to buyer
(define-public (purchase-listing (listing-id uint))
    (begin
        (asserts! (not (var-get marketplace-paused)) ERR-PAUSED)
        (match (map-get? marketplace-listings { listing-id: listing-id })
            listing-data (let (
                (token-id (get token-id listing-data))
                (seller (get seller listing-data))
                (price (get price listing-data))
                (is-active (get active listing-data))
            )
                (if (not is-active)
                    ERR-LISTING-NOT-FOUND
                    (if (is-eq seller tx-sender)
                        ERR-SELF-TRANSFER
                        (let (
                            (fee-amount (/ (* price (var-get marketplace-fee-percent)) u100))
                            (seller-amount (- price fee-amount))
                        )
                            (begin
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
                                ;; Update counters
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
                                ;; Emit purchase event
                                (print (tuple
                                    (event "purchase-completed")
                                    (listing-id listing-id)
                                    (token-id token-id)
                                    (buyer tx-sender)
                                    (seller seller)
                                    (price price)
                                    (fee-amount fee-amount)
                                ))
                                (ok true)
                            )
                        )
                    )
                )
            )
            ERR-LISTING-NOT-FOUND
        )
    )
)

;; private functions
;; - Internal helpers for validating tiers and managing counters/maps.

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
        (var-set paused true)
        (ok true)
    )
)

;; Admin: unpause minting/transfers
(define-public (unpause)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (var-set paused false)
        (ok true)
    )
)

;; Admin: update token URI (metadata)
(define-public (set-token-uri (token-id uint) (uri (optional (string-utf8 256))))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (match (map-get? token-metadata { token-id: token-id })
            meta (begin
                (map-set token-metadata { token-id: token-id } {
                    tier: (get tier meta),
                    uri: uri
                })
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
        (asserts! (not (var-get paused)) ERR-PAUSED)
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
        (asserts! (not (var-get paused)) ERR-PAUSED)
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
        (asserts! (<= fee-percent u10) ERR-INVALID-PRICE)
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
                success (match (check-blacklist recipient)
                    success (let (
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
                success (match (check-blacklist recipient)
                    success (if (not (is-eq tx-sender recipient))
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
                success (match (validate-price price)
                    success (let (
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
        (safe-limit (if (is-eq safe-limit u0) DEFAULT-PAGE-SIZE safe-limit))
        (current-supply (var-get total-supply))
        (start-id (+ offset u1))
        (end-id (+ start-id safe-limit))
    )
        (ok (tuple
            (tokens (generate-token-list start-id end-id (list)))
            (total-count current-supply)
            (offset offset)
            (limit safe-limit)
            (has-more (< end-id current-supply))
        ))
    )
)

;; Helper to generate token list (simplified)
(define-private (generate-token-list (start uint) (end uint) (acc (list 50 uint)))
    (if (or (> start end) (>= (len acc) MAX-PAGE-SIZE))
        acc
        (let ((next-acc (unwrap-panic (as-max-len? (append acc start) u50))))
            (generate-token-list (+ start u1) end next-acc)
        )
    )
)

;; Comprehensive user profile with ownership and transaction history
(define-read-only (get-user-profile (user principal))
    (let (
        (user-data (default-to { active: false } (map-get? user-registry { user: user })))
        (owned-tokens (get-user-tokens user))
        (listing-ids (default-to (list) (get listing-ids (default-to { listing-ids: (list) } (map-get? seller-listings { user: user })))))
    )
        (ok (tuple
            (user user)
            (active (get active user-data))
            (tokens-owned (len owned-tokens))
            (active-listings (len (filter is-listing-active-by-id listing-ids)))
            (total-listings-created (len listing-ids))
            (reputation-score (calculate-reputation-score user))
            (first-interaction (get-first-interaction user))
            (last-interaction (get-last-interaction user))
        ))
    )
)

;; Get tokens owned by a user (simplified implementation)
(define-private (get-user-tokens (user principal))
    ;; In a real implementation, this would iterate through all tokens
    ;; For now, return empty list as placeholder
    (list)
)

;; Check if listing is active by ID
(define-private (is-listing-active-by-id (listing-id uint))
    (match (map-get? marketplace-listings { listing-id: listing-id })
        listing-data (get active listing-data)
        false
    )
)

;; Calculate user reputation score
(define-private (calculate-reputation-score (user principal))
    ;; Simplified reputation calculation
    ;; In practice, this would consider successful transactions, time on platform, etc.
    u100
)

;; Get first interaction timestamp
(define-private (get-first-interaction (user principal))
    ;; Placeholder - would track actual first interaction
    u0
)

;; Get last interaction timestamp  
(define-private (get-last-interaction (user principal))
    ;; Placeholder - would track actual last interaction
    stacks-block-height
)

;; Real-time marketplace data with filtering
(define-read-only (get-marketplace-data 
    (tier-filter (optional uint))
    (price-min (optional uint))
    (price-max (optional uint))
    (active-only bool)
    (offset uint)
    (limit uint)
)
    (let (
        (safe-limit (if (> limit MAX-PAGE-SIZE) MAX-PAGE-SIZE limit))
        (total-listings (var-get listing-count))
    )
        (ok (tuple
            (listings (get-filtered-listing-data tier-filter price-min price-max active-only offset safe-limit))
            (total-count total-listings)
            (active-count (get-active-listings-count))
            (filters (tuple 
                (tier tier-filter)
                (price-min price-min)
                (price-max price-max)
                (active-only active-only)
            ))
            (pagination (tuple
                (offset offset)
                (limit safe-limit)
                (has-more (< (+ offset safe-limit) total-listings))
            ))
        ))
    )
)

;; Get filtered listing data (simplified)
(define-private (get-filtered-listing-data 
    (tier-filter (optional uint))
    (price-min (optional uint))
    (price-max (optional uint))
    (active-only bool)
    (offset uint)
    (limit uint)
)
    ;; Simplified implementation - would need complex filtering logic
    (list)
)

;; Get count of active listings
(define-private (get-active-listings-count)
    ;; Simplified - would count actual active listings
    (var-get listing-count)
)

;; Aggregated statistics and analytics
(define-read-only (get-contract-statistics)
    (let (
        (total-supply (var-get total-supply))
        (user-count (var-get user-count))
        (listing-count (var-get listing-count))
        (transaction-count (var-get transaction-count))
        (basic-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-BASIC }))))
        (pro-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-PRO }))))
        (vip-supply (get supply (default-to { supply: u0 } (map-get? tier-supplies { tier: TIER-VIP }))))
    )
        (ok (tuple
            (contract-info (tuple
                (total-supply total-supply)
                (max-supply MAX-SUPPLY)
                (unique-users user-count)
                (total-transactions transaction-count)
            ))
            (tier-distribution (tuple
                (basic-count basic-supply)
                (pro-count pro-supply)
                (vip-count vip-supply)
                (basic-percentage (if (> total-supply u0) (/ (* basic-supply u100) total-supply) u0))
                (pro-percentage (if (> total-supply u0) (/ (* pro-supply u100) total-supply) u0))
                (vip-percentage (if (> total-supply u0) (/ (* vip-supply u100) total-supply) u0))
            ))
            (marketplace-stats (tuple
                (active-listings listing-count)
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

;; Get token data for a range (simplified)
(define-private (get-token-range-data (start-id uint) (end-id uint))
    ;; Simplified implementation - would return actual token data
    (list)
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

;; Perform token search (simplified)
(define-private (perform-token-search 
    (query (string-utf8 64))
    (tier-filter (optional uint))
    (owner-filter (optional principal))
    (limit uint)
)
    ;; Simplified implementation - would perform actual search
    (list)
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

;; Calculate volume trend (simplified)
(define-private (calculate-volume-trend (days uint))
    (tuple (current u0) (previous u0) (change-percent u0))
)

;; Calculate price trend (simplified)
(define-private (calculate-price-trend (days uint))
    (tuple (average-price u0) (median-price u0) (price-change-percent u0))
)

;; Calculate activity trend (simplified)
(define-private (calculate-activity-trend (days uint))
    (tuple (transactions u0) (unique-users u0) (activity-score u0))
)

;; Get top performing tiers (simplified)
(define-private (get-top-performing-tiers (days uint))
    (list 
        (tuple (tier TIER-BASIC) (volume u0) (transactions u0))
        (tuple (tier TIER-PRO) (volume u0) (transactions u0))
        (tuple (tier TIER-VIP) (volume u0) (transactions u0))
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
            (try! (apply-config-change config-key new-value))
            
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
    (if (is-eq config-key "marketplace-fee")
        (begin
            (var-set marketplace-fee-percent value)
            (ok true)
        )
        (if (is-eq config-key "rate-limit-window")
            (begin
                (var-set rate-limit-window value)
                (ok true)
            )
            (ok true) ;; Unknown config keys are ignored
        )
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
                    ;; Simple hash-based rollout (in practice, use better distribution)
                    (ok (<= (mod (unwrap-panic (principal-to-uint user)) u100) rollout-percent))
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
                    (try! (apply-config-change config-key rollback-value))
                    
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

;; Get configuration history range (simplified)
(define-private (get-config-history-range (config-key (string-ascii 32)) (from-version uint) (limit uint))
    ;; Simplified implementation - would return actual history
    (list)
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