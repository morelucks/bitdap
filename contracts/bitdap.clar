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
;; SIP-009 NFT trait implementation
(use-trait nft-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; token definitions
;; - Bitdap Pass uses uint token-ids (u1, u2, ...) to identify each NFT.
;; - Each token-id is associated with exactly one owner and one tier.
;;

;; constants
;; - Collection-wide configuration, tier identifiers, and error codes.

;; Error codes
(define-constant ERR-INVALID-TIER (err u100))
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-NOT-OWNER (err u102))
(define-constant ERR-SELF-TRANSFER (err u103))
(define-constant ERR-MAX-SUPPLY (err u104))
(define-constant ERR-MAX-TIER-SUPPLY (err u105))
(define-constant ERR-UNAUTHORIZED (err u106))
(define-constant ERR-PAUSED (err u107))
(define-constant ERR-LISTING-NOT-FOUND (err u108))
(define-constant ERR-INVALID-PRICE (err u109))
(define-constant ERR-LISTING-EXPIRED (err u110))

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

;; listing-id -> listing details
(define-map marketplace-listings
    { listing-id: uint }
    {
        token-id: uint,
        seller: principal,
        price: uint,
        created-at: uint,
        active: bool
    }
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
        (asserts! (not (var-get paused)) ERR-PAUSED)
        (asserts! (not (var-get marketplace-paused)) ERR-PAUSED)
        ;; Validate tier first.
        (if (not (is-valid-tier tier))
            ERR-INVALID-TIER
            (let (
                    (current-total (var-get total-supply))
                    (new-total (+ current-total u1))
                )
                ;; Check global max supply.
                (if (> new-total MAX-SUPPLY)
                    ERR-MAX-SUPPLY
                    (let (
                            (tier-row (default-to { supply: u0 } (map-get? tier-supplies { tier: tier })))
                            (tier-supply (get supply tier-row))
                            (new-tier-supply (+ tier-supply u1))
                        )
                        ;; Check per-tier max supply.
                        (if (is-tier-over-max? tier new-tier-supply)
                            ERR-MAX-TIER-SUPPLY
                            (let (
                                    (token-id (var-get next-token-id))
                                    (recipient tx-sender)
                                )
                                (begin
                                    ;; Write ownership and metadata.
                                    (map-set token-owners { token-id: token-id } { owner: recipient })
                                    (map-set token-metadata { token-id: token-id } {
                                        tier: tier,
                                        uri: uri,
                                    })
                                    ;; Update counters.
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
                                    ;; Emit mint event.
                                    (print (tuple
                                        (event "mint-event")
                                        (token-id token-id)
                                        (owner recipient)
                                        (tier tier)
                                    ))
                                    (ok token-id)
                                )
                            )
                        )
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
    (let ((owner-row (map-get? token-owners { token-id: token-id })))
        (match owner-row
            owner-data (let ((owner (get owner owner-data)))
                (if (not (is-eq owner tx-sender))
                    ERR-NOT-OWNER
                    (if (var-get paused)
                        ERR-PAUSED
                        (if (is-eq owner recipient)
                            ERR-SELF-TRANSFER
                            (begin
                                (map-set token-owners { token-id: token-id } { owner: recipient })
                                ;; Emit transfer event.
                                (print (tuple
                                    (event "transfer-event")
                                    (token-id token-id)
                                    (from owner)
                                    (to recipient)
                                ))
                                (ok true)
                            )
                        )
                    )
                )
            )
            ERR-NOT-FOUND
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
                    created-at: (get created-at listing-data),
                    active: (get active listing-data)
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
                    created-at: (get created-at listing-data),
                    active: false
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
                (err ERR-NOT-FOUND)
                (let ((owner (get owner (unwrap! owner-row ERR-NOT-FOUND))))
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
                        (err ERR-NOT-OWNER)
                    )
                )
            )
        )
        error acc
    )
)
