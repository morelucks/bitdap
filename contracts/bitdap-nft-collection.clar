;; title: Bitdap NFT Collection
;; version: 1.0.0
;; summary: General-purpose NFT collection contract for the Bitdap ecosystem
;; description: >
;;   Bitdap NFT Collection is a comprehensive, SIP-009 compliant smart contract
;;   that enables the creation and management of NFT collections on the Stacks blockchain.
;;   This contract provides a flexible framework for deploying custom NFT collections
;;   with configurable parameters, royalty support, and administrative controls.

;; SIP-009 trait implementation
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Constants

;; Error codes
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-INVALID-AMOUNT (err u400))
(define-constant ERR-INSUFFICIENT-PAYMENT (err u402))
(define-constant ERR-MINT-LIMIT-EXCEEDED (err u403))
(define-constant ERR-MAX-SUPPLY-REACHED (err u405))
(define-constant ERR-CONTRACT-PAUSED (err u406))
(define-constant ERR-SELF-TRANSFER (err u407))
(define-constant ERR-INVALID-ROYALTY (err u408))
(define-constant ERR-INVALID-RECIPIENT (err u409))
(define-constant ERR-TOKEN-EXISTS (err u410))
(define-constant ERR-MINTING-DISABLED (err u411))
(define-constant ERR-INVALID-TOKEN-ID (err u412))
(define-constant ERR-BATCH-LIMIT-EXCEEDED (err u413))
(define-constant ERR-INVALID-METADATA (err u414))
(define-constant ERR-TRANSFER-FAILED (err u415))

;; Collection constants
(define-constant MAX-ROYALTY-PERCENT u1000) ;; 10% maximum royalty
(define-constant DEFAULT-MAX-SUPPLY u10000)
(define-constant DEFAULT-PER-ADDRESS-LIMIT u10)

;; Contract initialization
;; Initialize with default collection parameters
(define-data-var initialized bool false)

;; Contract deployer becomes initial owner
(define-data-var contract-owner principal tx-sender)

;; Initialize contract on deployment
(begin
    (var-set initialized true)
    (print {
        event: "contract-initialized",
        owner: tx-sender,
        timestamp: block-height
    })
)

;; Data Variables

;; Collection metadata
(define-data-var collection-name (string-ascii 64) "Bitdap NFT Collection")
(define-data-var collection-symbol (string-ascii 16) "BDNFT")
(define-data-var collection-uri (optional (string-utf8 256)) none)
(define-data-var collection-description (string-utf8 256) u"General-purpose NFT collection for Bitdap ecosystem")

;; Collection configuration
(define-data-var next-token-id uint u1)
(define-data-var total-supply uint u0)
(define-data-var max-supply uint DEFAULT-MAX-SUPPLY)

;; Minting parameters
(define-data-var mint-price uint u0) ;; Price in microSTX
(define-data-var per-address-limit uint DEFAULT-PER-ADDRESS-LIMIT)
(define-data-var minting-enabled bool true)

;; Administrative variables
(define-data-var contract-paused bool false)

;; Royalty system
(define-data-var royalty-percent uint u0) ;; Royalty percentage in basis points (0-1000 = 0-10%)
(define-data-var royalty-recipient principal tx-sender)
(define-data-var total-royalties-collected uint u0)

;; Data Maps

;; Token ownership tracking
;; token-id -> owner principal
(define-map token-owners
    { token-id: uint }
    { owner: principal }
)

;; Token metadata storage
;; token-id -> metadata URI
(define-map token-metadata
    { token-id: uint }
    { uri: (optional (string-utf8 256)) }
)

;; Per-address minting count tracking
;; principal -> mint count
(define-map address-mint-count
    { address: principal }
    { count: uint }
)

;; Token existence tracking for efficient queries
;; token-id -> exists flag
(define-map token-exists
    { token-id: uint }
    { exists: bool }
)

;; Token approval system for enhanced transfer functionality
(define-map token-approvals
    { token-id: uint }
    { approved: principal }
)

;; Operator approvals for all tokens of an owner
(define-map operator-approvals
    { owner: principal, operator: principal }
    { approved: bool }
)

;; Approve another principal to transfer a specific token
(define-public (approve (token-id uint) (approved principal))
    (let (
        (owner-data (map-get? token-owners { token-id: token-id }))
    )
        (asserts! (is-some owner-data) ERR-NOT-FOUND)
        
        (let (
            (current-owner (get owner (unwrap! owner-data ERR-NOT-FOUND)))
        )
            (asserts! (is-eq current-owner tx-sender) ERR-UNAUTHORIZED)
            (asserts! (not (is-eq current-owner approved)) ERR-SELF-TRANSFER)
            
            (map-set token-approvals { token-id: token-id } { approved: approved })
            
            (print {
                event: "approval",
                token-id: token-id,
                owner: current-owner,
                approved: approved,
                timestamp: block-height
            })
            
            (ok true)
        )
    )
)

;; Set approval for all tokens (operator approval)
(define-public (set-approval-for-all (operator principal) (approved bool))
    (begin
        (asserts! (not (is-eq tx-sender operator)) ERR-SELF-TRANSFER)
        
        (map-set operator-approvals 
            { owner: tx-sender, operator: operator } 
            { approved: approved }
        )
        
        (print {
            event: "approval-for-all",
            owner: tx-sender,
            operator: operator,
            approved: approved,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Check if an operator is approved for a specific token
(define-private (is-approved-for-token (token-id uint) (operator principal))
    (match (map-get? token-approvals { token-id: token-id })
        approval-data (is-eq (get approved approval-data) operator)
        false
    )
)

;; Private Functions

;; Check if caller is contract owner
(define-private (is-owner (caller principal))
    (is-eq caller (var-get contract-owner))
)

;; Get mint count for address (returns 0 if not found)
(define-private (get-mint-count (address principal))
    (default-to u0 (get count (map-get? address-mint-count { address: address })))
)

;; Increment mint count for address
(define-private (increment-mint-count (address principal))
    (let ((current-count (get-mint-count address)))
        (map-set address-mint-count { address: address } { count: (+ current-count u1) })
    )
)

;; Public Functions

;; Mint a new NFT to the specified recipient
(define-public (mint (recipient principal) (uri (optional (string-utf8 256))))
    (let (
        (token-id (var-get next-token-id))
        (current-supply (var-get total-supply))
        (max-supply-limit (var-get max-supply))
        (recipient-mint-count (get-mint-count recipient))
        (per-address-limit-value (var-get per-address-limit))
        (mint-price-value (var-get mint-price))
    )
        ;; Validate contract state
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (var-get minting-enabled) ERR-CONTRACT-PAUSED)
        
        ;; Validate supply limits
        (asserts! (< current-supply max-supply-limit) ERR-MAX-SUPPLY-REACHED)
        
        ;; Validate per-address minting limit
        (asserts! (< recipient-mint-count per-address-limit-value) ERR-MINT-LIMIT-EXCEEDED)
        
        ;; Validate recipient
        (asserts! (not (is-eq recipient (as-contract tx-sender))) ERR-INVALID-RECIPIENT)
        
        ;; Validate payment if mint price is set
        (if (> mint-price-value u0)
            (try! (stx-transfer? mint-price-value tx-sender (as-contract tx-sender)))
            true
        )
        
        ;; Update token ownership and metadata
        (map-set token-owners { token-id: token-id } { owner: recipient })
        (map-set token-metadata { token-id: token-id } { uri: uri })
        (map-set token-exists { token-id: token-id } { exists: true })
        
        ;; Update counters
        (var-set next-token-id (+ token-id u1))
        (var-set total-supply (+ current-supply u1))
        (increment-mint-count recipient)
        
        ;; Emit mint event
        (print {
            event: "mint",
            token-id: token-id,
            recipient: recipient,
            uri: uri,
            minter: tx-sender,
            price-paid: mint-price-value,
            timestamp: block-height
        })
        
        ;; Return token ID
        (ok token-id)
    )
)

;; Transfer NFT from sender to recipient
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
    (let (
        (owner-data (map-get? token-owners { token-id: token-id }))
    )
        ;; Validate contract state
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        ;; Validate token exists
        (asserts! (is-some owner-data) ERR-NOT-FOUND)
        
        (let (
            (current-owner (get owner (unwrap! owner-data ERR-NOT-FOUND)))
        )
            ;; Validate ownership
            (asserts! (is-eq current-owner sender) ERR-UNAUTHORIZED)
            (asserts! (is-eq sender tx-sender) ERR-UNAUTHORIZED)
            
            ;; Prevent self-transfer
            (asserts! (not (is-eq sender recipient)) ERR-SELF-TRANSFER)
            
            ;; Update ownership
            (map-set token-owners { token-id: token-id } { owner: recipient })
            
            ;; Emit transfer event
            (print {
                event: "transfer",
                token-id: token-id,
                sender: sender,
                recipient: recipient,
                timestamp: block-height
            })
            
            (ok true)
        )
    )
)

;; Transfer from - allows approved operators to transfer tokens
(define-public (transfer-from (token-id uint) (sender principal) (recipient principal))
    (let (
        (owner-data (map-get? token-owners { token-id: token-id }))
    )
        ;; Validate contract state
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        ;; Validate token exists
        (asserts! (is-some owner-data) ERR-NOT-FOUND)
        
        (let (
            (current-owner (get owner (unwrap! owner-data ERR-NOT-FOUND)))
        )
            ;; Validate ownership or approval
            (asserts! (is-eq current-owner sender) ERR-UNAUTHORIZED)
            (asserts! (or 
                (is-eq sender tx-sender)
                (is-approved-for-token token-id tx-sender)
                (is-approved-for-all sender tx-sender)
            ) ERR-UNAUTHORIZED)
            
            ;; Prevent self-transfer
            (asserts! (not (is-eq sender recipient)) ERR-SELF-TRANSFER)
            
            ;; Clear token approval after transfer
            (map-delete token-approvals { token-id: token-id })
            
            ;; Update ownership
            (map-set token-owners { token-id: token-id } { owner: recipient })
            
            ;; Emit transfer event
            (print {
                event: "transfer-from",
                token-id: token-id,
                sender: sender,
                recipient: recipient,
                operator: tx-sender,
                timestamp: block-height
            })
            
            (ok true)
        )
    )
)
;; SIP-009 compliant transfer with memo support
(define-public (transfer-memo (token-id uint) (sender principal) (recipient principal) (memo (buff 34)))
    (begin
        ;; Execute standard transfer
        (try! (transfer token-id sender recipient))
        
        ;; Emit memo
        (print {
            event: "transfer-memo",
            token-id: token-id,
            sender: sender,
            recipient: recipient,
            memo: memo,
            timestamp: block-height
        })
        
        (ok true)
    )
)
;; Burn (permanently destroy) an NFT
(define-public (burn (token-id uint))
    (let (
        (owner-data (map-get? token-owners { token-id: token-id }))
        (current-supply (var-get total-supply))
    )
        ;; Validate contract state
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        ;; Validate token exists
        (asserts! (is-some owner-data) ERR-NOT-FOUND)
        
        (let (
            (current-owner (get owner (unwrap! owner-data ERR-NOT-FOUND)))
        )
            ;; Validate ownership
            (asserts! (is-eq current-owner tx-sender) ERR-UNAUTHORIZED)
            
            ;; Delete token data (cleanup)
            (map-delete token-owners { token-id: token-id })
            (map-delete token-metadata { token-id: token-id })
            (map-delete token-exists { token-id: token-id })
            
            ;; Update supply counter
            (var-set total-supply (if (> current-supply u0) (- current-supply u1) u0))
            
            ;; Emit burn event
            (print {
                event: "burn",
                token-id: token-id,
                owner: current-owner,
                timestamp: block-height
            })
            
            (ok true)
        )
    )
)
;; Read-Only Functions (SIP-009 Compliance)

;; Get the owner of a specific token
(define-read-only (get-owner (token-id uint))
    (match (map-get? token-owners { token-id: token-id })
        owner-data (ok (some (get owner owner-data)))
        (ok none)
    )
)

;; Check if a token exists
(define-read-only (token-exists? (token-id uint))
    (is-some (map-get? token-owners { token-id: token-id }))
)

;; Get the last minted token ID
(define-read-only (get-last-token-id)
    (let ((next-id (var-get next-token-id)))
        (if (> next-id u1)
            (ok (- next-id u1))
            (ok u0)
        )
    )
)
;; Get token URI (metadata)
(define-read-only (get-token-uri (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        metadata-data (ok (get uri metadata-data))
        (ok none)
    )
)

;; Get collection name
(define-read-only (get-collection-name)
    (ok (var-get collection-name))
)

;; Get collection symbol  
(define-read-only (get-collection-symbol)
    (ok (var-get collection-symbol))
)

;; Get collection URI
(define-read-only (get-collection-uri)
    (ok (var-get collection-uri))
)

;; Get total supply
(define-read-only (get-total-supply)
    (ok (var-get total-supply))
)
;; Administrative Functions

;; Set collection metadata (owner only)
(define-public (set-collection-metadata 
    (name (string-ascii 64)) 
    (symbol (string-ascii 16)) 
    (uri (optional (string-utf8 256)))
    (description (string-utf8 256))
)
    (begin
        ;; Validate caller is owner
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        
        ;; Update collection metadata
        (var-set collection-name name)
        (var-set collection-symbol symbol)
        (var-set collection-uri uri)
        (var-set collection-description description)
        
        ;; Emit metadata update event
        (print {
            event: "collection-metadata-updated",
            name: name,
            symbol: symbol,
            uri: uri,
            description: description,
            updated-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Get collection description
(define-read-only (get-collection-description)
    (ok (var-get collection-description))
)
;; Set mint price (owner only)
(define-public (set-mint-price (price uint))
    (begin
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (var-set mint-price price)
        
        (print {
            event: "mint-price-updated",
            price: price,
            updated-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Set per-address minting limit (owner only)
(define-public (set-per-address-limit (limit uint))
    (begin
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (var-set per-address-limit limit)
        
        (print {
            event: "per-address-limit-updated",
            limit: limit,
            updated-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Set maximum supply (owner only)
(define-public (set-max-supply (supply uint))
    (begin
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        ;; Ensure new max supply is not less than current supply
        (asserts! (>= supply (var-get total-supply)) ERR-INVALID-AMOUNT)
        (var-set max-supply supply)
        
        (print {
            event: "max-supply-updated",
            supply: supply,
            updated-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Get minting information
(define-read-only (get-mint-info)
    (ok {
        price: (var-get mint-price),
        per-address-limit: (var-get per-address-limit),
        max-supply: (var-get max-supply),
        current-supply: (var-get total-supply),
        minting-enabled: (var-get minting-enabled)
    })
)
;; Pause contract operations (owner only)
(define-public (pause-contract)
    (begin
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (var-set contract-paused true)
        
        (print {
            event: "contract-paused",
            paused-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Unpause contract operations (owner only)
(define-public (unpause-contract)
    (begin
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (var-set contract-paused false)
        
        (print {
            event: "contract-unpaused",
            unpaused-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Toggle minting enabled state (owner only)
(define-public (set-minting-enabled (enabled bool))
    (begin
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (var-set minting-enabled enabled)
        
        (print {
            event: "minting-enabled-updated",
            enabled: enabled,
            updated-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Get contract status
(define-read-only (get-contract-status)
    (ok {
        paused: (var-get contract-paused),
        minting-enabled: (var-get minting-enabled),
        owner: (var-get contract-owner)
    })
)
;; Transfer contract ownership (owner only)
(define-public (transfer-ownership (new-owner principal))
    (begin
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (asserts! (not (is-eq new-owner tx-sender)) ERR-SELF-TRANSFER)
        
        (let ((old-owner (var-get contract-owner)))
            (var-set contract-owner new-owner)
            
            (print {
                event: "ownership-transferred",
                old-owner: old-owner,
                new-owner: new-owner,
                timestamp: block-height
            })
            
            (ok true)
        )
    )
)

;; Get current contract owner
(define-read-only (get-contract-owner)
    (ok (var-get contract-owner))
)
;; Royalty System Functions

;; Set royalty information (owner only)
(define-public (set-royalty-info (recipient principal) (percentage uint))
    (begin
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (asserts! (<= percentage MAX-ROYALTY-PERCENT) ERR-INVALID-ROYALTY)
        
        (var-set royalty-recipient recipient)
        (var-set royalty-percent percentage)
        
        (print {
            event: "royalty-info-updated",
            recipient: recipient,
            percentage: percentage,
            updated-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Get royalty information
(define-read-only (get-royalty-info)
    (ok {
        recipient: (var-get royalty-recipient),
        percentage: (var-get royalty-percent),
        max-percentage: MAX-ROYALTY-PERCENT,
        total-collected: (var-get total-royalties-collected)
    })
)
;; Calculate royalty amount for a given sale price
(define-read-only (calculate-royalty (sale-price uint))
    (let (
        (royalty-percentage (var-get royalty-percent))
        (royalty-amount (/ (* sale-price royalty-percentage) u10000))
    )
        (ok {
            sale-price: sale-price,
            royalty-amount: royalty-amount,
            royalty-percentage: royalty-percentage,
            recipient: (var-get royalty-recipient)
        })
    )
)

;; Record royalty payment (for external marketplace integration)
(define-public (record-royalty-payment (amount uint))
    (begin
        ;; This function can be called by marketplaces to record royalty payments
        ;; In a full implementation, this might include STX transfer validation
        (var-set total-royalties-collected (+ (var-get total-royalties-collected) amount))
        
        (print {
            event: "royalty-payment-recorded",
            amount: amount,
            recipient: (var-get royalty-recipient),
            total-collected: (var-get total-royalties-collected),
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Fund Management Functions

;; Withdraw accumulated funds from minting (owner only)
(define-public (withdraw-funds (amount uint))
    (let (
        (contract-balance (stx-get-balance (as-contract tx-sender)))
    )
        ;; Validate caller is owner
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        
        ;; Validate amount
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        (asserts! (<= amount contract-balance) ERR-INSUFFICIENT-PAYMENT)
        
        ;; Transfer STX to owner
        (try! (as-contract (stx-transfer? amount tx-sender (var-get contract-owner))))
        
        ;; Emit withdrawal event
        (print {
            event: "funds-withdrawn",
            amount: amount,
            recipient: (var-get contract-owner),
            remaining-balance: (- contract-balance amount),
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Withdraw all accumulated funds (owner only)
(define-public (withdraw-all-funds)
    (let (
        (contract-balance (stx-get-balance (as-contract tx-sender)))
    )
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (asserts! (> contract-balance u0) ERR-INVALID-AMOUNT)
        
        (try! (withdraw-funds contract-balance))
        (ok true)
    )
)

;; Get contract balance
(define-read-only (get-contract-balance)
    (ok (stx-get-balance (as-contract tx-sender)))
)
;; Batch Operations

;; Batch burn multiple NFTs
(define-public (batch-burn (token-ids (list 10 uint)))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (fold batch-burn-helper token-ids (ok u0))
    )
)

;; Helper function for batch burning
(define-private (batch-burn-helper 
    (token-id uint)
    (acc (response uint uint))
)
    (match acc
        success-count (let (
            (owner-data (map-get? token-owners { token-id: token-id }))
            (current-supply (var-get total-supply))
        )
            (if (is-some owner-data)
                (let (
                    (current-owner (get owner (unwrap! owner-data (err u101))))
                )
                    (if (is-eq current-owner tx-sender)
                        (begin
                            ;; Delete token data (cleanup)
                            (map-delete token-owners { token-id: token-id })
                            (map-delete token-metadata { token-id: token-id })
                            (map-delete token-exists { token-id: token-id })
                            
                            ;; Update supply counter
                            (var-set total-supply (if (> current-supply u0) (- current-supply u1) u0))
                            
                            ;; Emit burn event
                            (print {
                                event: "batch-burn",
                                token-id: token-id,
                                owner: current-owner,
                                timestamp: block-height
                            })
                            
                            (ok (+ success-count u1))
                        )
                        (err u401) ;; Unauthorized
                    )
                )
                (err u404) ;; Token not found
            )
        )
        error acc
    )
)

;; Batch mint multiple NFTs with payment validation
(define-public (batch-mint (recipients (list 10 { recipient: principal, uri: (optional (string-utf8 256)) })))
    (let (
        (mint-price-value (var-get mint-price))
        (batch-size (len recipients))
        (total-cost (* mint-price-value batch-size))
    )
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (var-get minting-enabled) ERR-MINTING-DISABLED)
        (asserts! (<= batch-size u10) ERR-BATCH-LIMIT-EXCEEDED)
        
        ;; Validate payment for batch minting
        (if (> total-cost u0)
            (try! (stx-transfer? total-cost tx-sender (as-contract tx-sender)))
            true
        )
        
        (fold batch-mint-helper recipients (ok (list)))
    )
)

;; Helper function for batch minting
(define-private (batch-mint-helper 
    (item { recipient: principal, uri: (optional (string-utf8 256)) })
    (acc (response (list 10 uint) uint))
)
    (match acc
        success-list (let (
            (token-id (var-get next-token-id))
            (current-supply (var-get total-supply))
            (max-supply-limit (var-get max-supply))
            (recipient (get recipient item))
            (uri (get uri item))
        )
            (if (and 
                (< current-supply max-supply-limit)
                (not (is-eq recipient (as-contract tx-sender)))
            )
                (begin
                    ;; Update token data
                    (map-set token-owners { token-id: token-id } { owner: recipient })
                    (map-set token-metadata { token-id: token-id } { uri: uri })
                    (map-set token-exists { token-id: token-id } { exists: true })
                    
                    ;; Update counters
                    (var-set next-token-id (+ token-id u1))
                    (var-set total-supply (+ current-supply u1))
                    (increment-mint-count recipient)
                    
                    ;; Emit mint event
                    (print {
                        event: "batch-mint",
                        token-id: token-id,
                        recipient: recipient,
                        uri: uri,
                        minter: tx-sender,
                        timestamp: block-height
                    })
                    
                    (ok (unwrap-panic (as-max-len? (append success-list token-id) u10)))
                )
                acc ;; Return unchanged if validation fails
            )
        )
        error acc
    )
)
;; Batch transfer multiple NFTs
(define-public (batch-transfer (transfers (list 10 { token-id: uint, recipient: principal })))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
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
            (owner-data (map-get? token-owners { token-id: token-id }))
        )
            (if (is-some owner-data)
                (let (
                    (current-owner (get owner (unwrap! owner-data (err u101))))
                )
                    (if (and 
                        (is-eq current-owner tx-sender)
                        (not (is-eq current-owner recipient))
                    )
                        (begin
                            ;; Update ownership
                            (map-set token-owners { token-id: token-id } { owner: recipient })
                            
                            ;; Emit transfer event
                            (print {
                                event: "batch-transfer",
                                token-id: token-id,
                                sender: current-owner,
                                recipient: recipient,
                                timestamp: block-height
                            })
                            
                            (ok true)
                        )
                        (err u102) ;; Unauthorized or self-transfer
                    )
                )
                (err u404) ;; Token not found
            )
        )
        error acc
    )
)
;; Query and Statistics Functions

;; Get comprehensive collection information
(define-read-only (get-collection-info)
    (ok {
        name: (var-get collection-name),
        symbol: (var-get collection-symbol),
        description: (var-get collection-description),
        uri: (var-get collection-uri),
        total-supply: (var-get total-supply),
        max-supply: (var-get max-supply),
        remaining-supply: (- (var-get max-supply) (var-get total-supply)),
        owner: (var-get contract-owner),
        paused: (var-get contract-paused),
        minting-enabled: (var-get minting-enabled)
    })
)

;; Get mint count for a specific address
(define-read-only (get-address-mint-count (address principal))
    (ok (get-mint-count address))
)

;; Get batch token information
(define-read-only (get-tokens-info (token-ids (list 10 uint)))
    (ok (map get-token-info-helper token-ids))
)

;; Helper function for batch token queries
(define-private (get-token-info-helper (token-id uint))
    {
        token-id: token-id,
        owner: (map-get? token-owners { token-id: token-id }),
        uri: (map-get? token-metadata { token-id: token-id }),
        exists: (is-some (map-get? token-owners { token-id: token-id }))
    }
)

;; Get contract version and info
(define-read-only (get-contract-info)
    (ok {
        version: "1.0.0",
        name: "Bitdap NFT Collection",
        description: "General-purpose NFT collection contract for the Bitdap ecosystem",
        sip-009-compliant: true,
        features: (list "minting" "burning" "transfers" "royalties" "batch-operations" "pause-controls")
    })
)