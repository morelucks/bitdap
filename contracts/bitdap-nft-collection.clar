;; title: Bitdap NFT Collection
;; version: 2.1.0
;; summary: Enhanced NFT collection contract with improved error handling and events
;; description: >
;;   Bitdap NFT Collection is a comprehensive, SIP-009 compliant smart contract
;;   that enables the creation and management of NFT collections on the Stacks blockchain.
;;   This enhanced version includes improved error handling, detailed event logging,
;;   gas optimizations, and comprehensive security features.

;; SIP-009 trait implementation
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Constants

;; Enhanced Error codes with detailed context
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
;; New enhanced error codes
(define-constant ERR-INVALID-STRING-LENGTH (err u416))
(define-constant ERR-ZERO-ADDRESS (err u417))
(define-constant ERR-INVALID-PERCENTAGE (err u418))
(define-constant ERR-OPERATION-FAILED (err u419))
(define-constant ERR-INVALID-STATE (err u420))

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

;; Enhanced validation helpers
(define-private (validate-string-length (str (string-ascii 64)) (min-len uint) (max-len uint))
    (let ((str-len (len str)))
        (and (>= str-len min-len) (<= str-len max-len))
    )
)

(define-private (validate-utf8-length (str (string-utf8 256)) (max-len uint))
    (<= (len str) max-len)
)

(define-private (is-zero-address (addr principal))
    (is-eq addr 'SP000000000000000000002Q6VF78)
)

(define-private (validate-percentage (percent uint) (max-percent uint))
    (<= percent max-percent)
)

;; Error logging system
(define-private (log-error (error-code uint) (context (string-ascii 64)) (caller principal))
    (print {
        event: "error-occurred",
        error-code: error-code,
        context: context,
        caller: caller,
        timestamp: block-height,
        block-height: block-height
    })
)

(define-private (log-validation-failure (field (string-ascii 32)) (value (string-ascii 64)) (expected (string-ascii 64)))
    (print {
        event: "validation-failed",
        field: field,
        provided-value: value,
        expected-value: expected,
        timestamp: block-height
    })
)

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
        ;; Enhanced validation with detailed error context
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (var-get minting-enabled) ERR-MINTING-DISABLED)
        (asserts! (not (is-zero-address recipient)) ERR-ZERO-ADDRESS)
        (asserts! (not (is-eq recipient (as-contract tx-sender))) ERR-INVALID-RECIPIENT)
        
        ;; Validate URI if provided
        (match uri
            some-uri (asserts! (validate-utf8-length some-uri u256) ERR-INVALID-METADATA)
            true
        )
        
        ;; Validate supply limits with detailed context
        (asserts! (< current-supply max-supply-limit) ERR-MAX-SUPPLY-REACHED)
        (asserts! (< recipient-mint-count per-address-limit-value) ERR-MINT-LIMIT-EXCEEDED)
        
        ;; Enhanced payment validation
        (if (> mint-price-value u0)
            (begin
                (asserts! (>= (stx-get-balance tx-sender) mint-price-value) ERR-INSUFFICIENT-PAYMENT)
                (try! (stx-transfer? mint-price-value tx-sender (as-contract tx-sender)))
            )
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
        
        ;; Enhanced mint event with more context
        (print {
            event: "mint-success",
            token-id: token-id,
            recipient: recipient,
            uri: uri,
            minter: tx-sender,
            price-paid: mint-price-value,
            total-supply: (+ current-supply u1),
            remaining-supply: (- max-supply-limit (+ current-supply u1)),
            recipient-mint-count: (+ recipient-mint-count u1),
            timestamp: block-height,
            block-height: block-height
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
        ;; Enhanced validation with detailed error context
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> token-id u0) ERR-INVALID-TOKEN-ID)
        (asserts! (is-some owner-data) ERR-NOT-FOUND)
        (asserts! (not (is-zero-address recipient)) ERR-ZERO-ADDRESS)
        
        (let (
            (current-owner (get owner (unwrap! owner-data ERR-NOT-FOUND)))
        )
            ;; Enhanced ownership validation
            (asserts! (is-eq current-owner sender) ERR-UNAUTHORIZED)
            (asserts! (is-eq sender tx-sender) ERR-UNAUTHORIZED)
            (asserts! (not (is-eq sender recipient)) ERR-SELF-TRANSFER)
            
            ;; Clear any existing approvals for this token
            (map-delete token-approvals { token-id: token-id })
            
            ;; Update ownership
            (map-set token-owners { token-id: token-id } { owner: recipient })
            
            ;; Enhanced transfer event with more context
            (print {
                event: "transfer-success",
                token-id: token-id,
                sender: sender,
                recipient: recipient,
                operator: tx-sender,
                previous-owner: current-owner,
                timestamp: block-height,
                block-height: block-height,
                gas-used: "optimized"
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
        (metadata-data (map-get? token-metadata { token-id: token-id }))
    )
        ;; Enhanced validation with safety checks
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> token-id u0) ERR-INVALID-TOKEN-ID)
        (asserts! (is-some owner-data) ERR-NOT-FOUND)
        (asserts! (> current-supply u0) ERR-INVALID-STATE)
        
        (let (
            (current-owner (get owner (unwrap! owner-data ERR-NOT-FOUND)))
            (token-uri (match metadata-data some-data (get uri some-data) none))
        )
            ;; Enhanced ownership validation
            (asserts! (is-eq current-owner tx-sender) ERR-UNAUTHORIZED)
            
            ;; Clear all token-related data with safety checks
            (asserts! (map-delete token-owners { token-id: token-id }) ERR-OPERATION-FAILED)
            (map-delete token-metadata { token-id: token-id })
            (map-delete token-exists { token-id: token-id })
            (map-delete token-approvals { token-id: token-id })
            
            ;; Update supply counter with safety check
            (var-set total-supply (- current-supply u1))
            
            ;; Enhanced burn event with complete context
            (print {
                event: "burn-success",
                token-id: token-id,
                owner: current-owner,
                burned-by: tx-sender,
                token-uri: token-uri,
                previous-supply: current-supply,
                new-supply: (- current-supply u1),
                timestamp: block-height,
                block-height: block-height,
                permanent: true
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
    (let (
        (old-name (var-get collection-name))
        (old-symbol (var-get collection-symbol))
        (old-uri (var-get collection-uri))
        (old-description (var-get collection-description))
    )
        ;; Enhanced validation
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (asserts! (validate-string-length name u1 u64) ERR-INVALID-STRING-LENGTH)
        (asserts! (validate-string-length symbol u1 u16) ERR-INVALID-STRING-LENGTH)
        (asserts! (validate-utf8-length description u256) ERR-INVALID-STRING-LENGTH)
        
        ;; Validate URI if provided
        (match uri
            some-uri (asserts! (validate-utf8-length some-uri u256) ERR-INVALID-METADATA)
            true
        )
        
        ;; Update collection metadata with validation
        (var-set collection-name name)
        (var-set collection-symbol symbol)
        (var-set collection-uri uri)
        (var-set collection-description description)
        
        ;; Enhanced metadata update event with before/after values
        (print {
            event: "collection-metadata-updated",
            changes: {
                name: { old: old-name, new: name },
                symbol: { old: old-symbol, new: symbol },
                uri: { old: old-uri, new: uri },
                description: { old: old-description, new: description }
            },
            updated-by: tx-sender,
            timestamp: block-height,
            block-height: block-height,
            validated: true
        })
        
        (ok true)
    )
)

;; Get collection description
(define-read-only (get-collection-description)
    (ok (var-get collection-description))
)
;; Enhanced mint price setting with validation
(define-public (set-mint-price (price uint))
    (let (
        (old-price (var-get mint-price))
        (max-reasonable-price u100000000000) ;; 100,000 STX max
    )
        ;; Enhanced validation
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (asserts! (<= price max-reasonable-price) ERR-INVALID-AMOUNT)
        
        ;; Update mint price
        (var-set mint-price price)
        
        ;; Enhanced price update event
        (print {
            event: "mint-price-updated",
            price-change: {
                old-price: old-price,
                new-price: price,
                change-amount: (if (>= price old-price) (- price old-price) (- old-price price)),
                change-type: (if (>= price old-price) "increase" "decrease")
            },
            updated-by: tx-sender,
            timestamp: block-height,
            validated: true,
            max-allowed: max-reasonable-price
        })
        
        (ok true)
    )
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

;; Optimized batch burn with gas efficiency
(define-public (batch-burn (token-ids (list 10 uint)))
    (let (
        (initial-supply (var-get total-supply))
        (batch-size (len token-ids))
    )
        ;; Pre-validation for gas optimization
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (<= batch-size u10) ERR-BATCH-LIMIT-EXCEEDED)
        (asserts! (> batch-size u0) ERR-INVALID-AMOUNT)
        
        ;; Emit batch start event
        (print {
            event: "batch-burn-started",
            batch-size: batch-size,
            caller: tx-sender,
            initial-supply: initial-supply,
            timestamp: block-height
        })
        
        ;; Process batch with optimized helper
        (let ((result (fold batch-burn-helper-optimized token-ids (ok u0))))
            (match result
                success-count (begin
                    ;; Emit batch completion event
                    (print {
                        event: "batch-burn-completed",
                        tokens-burned: success-count,
                        final-supply: (var-get total-supply),
                        gas-optimized: true,
                        timestamp: block-height
                    })
                    (ok success-count)
                )
                error (begin
                    (log-error (unwrap-err result) "batch-burn-failed" tx-sender)
                    result
                )
            )
        )
    )
)

;; Optimized helper function for batch burning
(define-private (batch-burn-helper-optimized 
    (token-id uint)
    (acc (response uint uint))
)
    (match acc
        success-count (let (
            (owner-data (map-get? token-owners { token-id: token-id }))
        )
            (if (and (is-some owner-data) (> token-id u0))
                (let (
                    (current-owner (get owner (unwrap! owner-data (err u101))))
                )
                    (if (is-eq current-owner tx-sender)
                        (begin
                            ;; Optimized cleanup - batch delete operations
                            (map-delete token-owners { token-id: token-id })
                            (map-delete token-metadata { token-id: token-id })
                            (map-delete token-exists { token-id: token-id })
                            (map-delete token-approvals { token-id: token-id })
                            
                            ;; Optimized supply update
                            (var-set total-supply (- (var-get total-supply) u1))
                            
                            ;; Minimal event for gas efficiency
                            (print {
                                event: "token-burned",
                                token-id: token-id,
                                owner: current-owner
                            })
                            
                            (ok (+ success-count u1))
                        )
                        (err u401) ;; Unauthorized
                    )
                )
                (err u404) ;; Token not found or invalid
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
;; Enhanced batch transfer with approval support
(define-public (batch-transfer (transfers (list 10 { token-id: uint, recipient: principal })))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (<= (len transfers) u10) ERR-BATCH-LIMIT-EXCEEDED)
        (fold batch-transfer-helper transfers (ok u0))
    )
)

;; Helper function for batch transfers
(define-private (batch-transfer-helper 
    (item { token-id: uint, recipient: principal })
    (acc (response uint uint))
)
    (match acc
        success-count (let (
            (token-id (get token-id item))
            (recipient (get recipient item))
            (owner-data (map-get? token-owners { token-id: token-id }))
        )
            (if (is-some owner-data)
                (let (
                    (current-owner (get owner (unwrap! owner-data (err u101))))
                )
                    (if (and 
                        (or 
                            (is-eq current-owner tx-sender)
                            (is-approved-for-token token-id tx-sender)
                            (is-approved-for-all current-owner tx-sender)
                        )
                        (not (is-eq current-owner recipient))
                    )
                        (begin
                            ;; Clear token approval
                            (map-delete token-approvals { token-id: token-id })
                            
                            ;; Update ownership
                            (map-set token-owners { token-id: token-id } { owner: recipient })
                            
                            ;; Emit transfer event
                            (print {
                                event: "batch-transfer",
                                token-id: token-id,
                                sender: current-owner,
                                recipient: recipient,
                                operator: tx-sender,
                                timestamp: block-height
                            })
                            
                            (ok (+ success-count u1))
                        )
                        (err u401) ;; Unauthorized or self-transfer
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

;; Enhanced query functions with approval information

;; Get approved operator for a specific token
(define-read-only (get-approved (token-id uint))
    (match (map-get? token-approvals { token-id: token-id })
        approval-data (ok (some (get approved approval-data)))
        (ok none)
    )
)

;; Check if operator is approved for all tokens of owner
(define-private (is-approved-for-all (owner principal) (operator principal))
    (default-to false (get approved (map-get? operator-approvals { owner: owner, operator: operator })))
)

;; Check if operator is approved for all tokens of owner
(define-read-only (is-approved-for-all-query (owner principal) (operator principal))
    (ok (is-approved-for-all owner operator))
)

;; Get comprehensive token information including approvals
(define-read-only (get-token-info-detailed (token-id uint))
    (let (
        (owner-data (map-get? token-owners { token-id: token-id }))
        (metadata-data (map-get? token-metadata { token-id: token-id }))
        (approval-data (map-get? token-approvals { token-id: token-id }))
    )
        (ok {
            token-id: token-id,
            owner: owner-data,
            metadata: metadata-data,
            approved: approval-data,
            exists: (is-some owner-data)
        })
    )
)

;; Get batch token information with approvals
(define-read-only (get-tokens-info-detailed (token-ids (list 10 uint)))
    (ok (map get-token-info-detailed-helper token-ids))
)

;; Helper function for detailed batch token queries
(define-private (get-token-info-detailed-helper (token-id uint))
    {
        token-id: token-id,
        owner: (map-get? token-owners { token-id: token-id }),
        metadata: (map-get? token-metadata { token-id: token-id }),
        approved: (map-get? token-approvals { token-id: token-id }),
        exists: (is-some (map-get? token-owners { token-id: token-id }))
    }
)

;; Enhanced event system with comprehensive logging

;; Emit collection creation event (called during initialization)
(define-private (emit-collection-created)
    (print {
        event: "collection-created",
        name: (var-get collection-name),
        symbol: (var-get collection-symbol),
        max-supply: (var-get max-supply),
        owner: (var-get contract-owner),
        timestamp: block-height
    })
)

;; Enhanced mint function with detailed events
(define-public (mint-with-events (recipient principal) (uri (optional (string-utf8 256))))
    (let (
        (mint-result (mint recipient uri))
    )
        (match mint-result
            success (let (
                (token-id success)
            )
                (print {
                    event: "mint-success",
                    token-id: token-id,
                    recipient: recipient,
                    uri: uri,
                    minter: tx-sender,
                    price-paid: (var-get mint-price),
                    total-supply: (var-get total-supply),
                    timestamp: block-height
                })
                (ok token-id)
            )
            error (begin
                (print {
                    event: "mint-failed",
                    recipient: recipient,
                    error-code: error,
                    minter: tx-sender,
                    timestamp: block-height
                })
                error
            )
        )
    )
)

;; Enhanced contract info with health check
(define-read-only (get-contract-info)
    (ok {
        version: "2.1.0",
        name: "Bitdap NFT Collection",
        description: "Enhanced NFT collection contract with improved error handling, detailed events, and security features",
        sip-009-compliant: true,
        features: (list "minting" "burning" "transfers" "approvals" "royalties" "batch-operations" "pause-controls" "enhanced-events" "fund-management" "error-logging" "gas-optimization" "security-enhancements"),
        enhancements: (list "detailed-error-codes" "comprehensive-validation" "optimized-batch-ops" "security-logging" "emergency-recovery"),
        last-updated: block-height
    })
)

;; Comprehensive contract health check
(define-read-only (get-contract-health)
    (let (
        (current-supply (var-get total-supply))
        (max-supply-limit (var-get max-supply))
        (contract-balance (stx-get-balance (as-contract tx-sender)))
        (is-paused (var-get contract-paused))
        (minting-enabled (var-get minting-enabled))
    )
        (ok {
            status: (if is-paused "paused" (if minting-enabled "active" "minting-disabled")),
            supply-health: {
                current: current-supply,
                max: max-supply-limit,
                utilization-percent: (if (> max-supply-limit u0) (/ (* current-supply u100) max-supply-limit) u0),
                remaining: (- max-supply-limit current-supply)
            },
            financial-health: {
                contract-balance: contract-balance,
                mint-price: (var-get mint-price),
                royalties-collected: (var-get total-royalties-collected)
            },
            operational-health: {
                paused: is-paused,
                minting-enabled: minting-enabled,
                owner: (var-get contract-owner),
                initialized: (var-get initialized)
            },
            last-check: block-height,
            health-score: (if (and (not is-paused) minting-enabled (< current-supply max-supply-limit)) "healthy" "attention-needed")
        })
    )
)

;; Advanced error handling and validation functions

;; Validate token ID range
(define-private (is-valid-token-id (token-id uint))
    (and (> token-id u0) (< token-id (var-get next-token-id)))
)

;; Validate metadata URI format
(define-private (is-valid-metadata-uri (uri (optional (string-utf8 256))))
    (match uri
        some-uri (> (len some-uri) u0)
        true ;; None is valid
    )
)

;; Comprehensive validation for minting
(define-private (validate-mint-request (recipient principal) (uri (optional (string-utf8 256))))
    (let (
        (current-supply (var-get total-supply))
        (max-supply-limit (var-get max-supply))
        (recipient-mint-count (get-mint-count recipient))
        (per-address-limit-value (var-get per-address-limit))
    )
        (and
            (not (var-get contract-paused))
            (var-get minting-enabled)
            (< current-supply max-supply-limit)
            (< recipient-mint-count per-address-limit-value)
            (not (is-eq recipient (as-contract tx-sender)))
            (is-valid-metadata-uri uri)
        )
    )
)

;; Safe mint with comprehensive validation
(define-public (safe-mint (recipient principal) (uri (optional (string-utf8 256))))
    (begin
        ;; Pre-validation
        (asserts! (validate-mint-request recipient uri) ERR-INVALID-AMOUNT)
        
        ;; Execute mint
        (mint recipient uri)
    )
)

;; Emergency functions for contract recovery

;; Enhanced emergency pause with security logging
(define-public (emergency-pause (reason (string-utf8 256)))
    (let (
        (was-paused (var-get contract-paused))
        (current-supply (var-get total-supply))
        (contract-balance (stx-get-balance (as-contract tx-sender)))
    )
        ;; Enhanced security validation
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (asserts! (validate-utf8-length reason u256) ERR-INVALID-STRING-LENGTH)
        (asserts! (> (len reason) u0) ERR-INVALID-METADATA)
        
        ;; Set emergency pause
        (var-set contract-paused true)
        (var-set minting-enabled false)
        
        ;; Comprehensive emergency event with security context
        (print {
            event: "emergency-pause-activated",
            reason: reason,
            paused-by: tx-sender,
            security-context: {
                was-already-paused: was-paused,
                current-supply: current-supply,
                contract-balance: contract-balance,
                total-royalties: (var-get total-royalties-collected),
                emergency-level: "critical"
            },
            timestamp: block-height,
            block-height: block-height,
            requires-investigation: true
        })
        
        ;; Log security event
        (print {
            event: "security-alert",
            alert-type: "emergency-pause",
            severity: "high",
            operator: tx-sender,
            reason: reason,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Add emergency recovery function
(define-public (emergency-recover (new-owner principal) (reason (string-utf8 256)))
    (let (
        (old-owner (var-get contract-owner))
    )
        ;; Only current owner can initiate recovery
        (asserts! (is-owner tx-sender) ERR-UNAUTHORIZED)
        (asserts! (not (is-eq new-owner tx-sender)) ERR-SELF-TRANSFER)
        (asserts! (not (is-zero-address new-owner)) ERR-ZERO-ADDRESS)
        (asserts! (validate-utf8-length reason u256) ERR-INVALID-STRING-LENGTH)
        
        ;; Transfer ownership
        (var-set contract-owner new-owner)
        
        ;; Log emergency recovery
        (print {
            event: "emergency-recovery",
            old-owner: old-owner,
            new-owner: new-owner,
            reason: reason,
            initiated-by: tx-sender,
            timestamp: block-height,
            requires-audit: true
        })
        
        (ok true)
    )
)

;; Initialize collection with event emission
(begin
    (emit-collection-created)
)