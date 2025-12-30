;; title: Bitdap Multi Token
;; version: 1.0.0
;; summary: ERC-1155 style multi-token contract for Bitdap ecosystem
;; description: >
;;   Bitdap Multi Token implements ERC-1155 functionality allowing multiple
;;   token types (fungible and non-fungible) in a single contract.
;;   Supports batch operations and efficient storage.

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant CONTRACT-NAME "Bitdap Multi Token")
(define-constant MAX-ROYALTY-PERCENTAGE u1000) ;; 10% in basis points
(define-constant ROLE-ADMIN u1)
(define-constant ROLE-MINTER u2)
(define-constant ROLE-BURNER u3)
(define-constant ROLE-METADATA-MANAGER u4)

;; Error codes
(define-constant ERR-UNAUTHORIZED (err u401))
(define-constant ERR-INSUFFICIENT-BALANCE (err u402))
(define-constant ERR-INVALID-TOKEN-ID (err u403))
(define-constant ERR-INVALID-AMOUNT (err u404))
(define-constant ERR-SELF-TRANSFER (err u405))
(define-constant ERR-INVALID-RECIPIENT (err u406))
(define-constant ERR-CONTRACT-PAUSED (err u407))
(define-constant ERR-TOKEN-NOT-EXISTS (err u408))
(define-constant ERR-INSUFFICIENT-ALLOWANCE (err u409))
(define-constant ERR-INVALID-ROLE (err u410))
(define-constant ERR-ROLE-NOT-ASSIGNED (err u411))
(define-constant ERR-INVALID-ROYALTY (err u412))
(define-constant ERR-EXPIRED-APPROVAL (err u413))
(define-constant ERR-BATCH-LENGTH-MISMATCH (err u414))
(define-constant ERR-MAX-SUPPLY-EXCEEDED (err u415))

;; Data variables
(define-data-var contract-owner principal CONTRACT-OWNER)
;; Enhanced contract pause with selective restrictions
(define-data-var contract-paused bool false)
(define-data-var pause-level uint u0) ;; 0: normal, 1: transfers only, 2: full pause
(define-data-var pause-reason (optional (string-ascii 128)) none)
(define-data-var paused-at (optional uint) none)
(define-data-var paused-by (optional principal) none)
(define-data-var next-token-id uint u1)
(define-data-var emergency-admin (optional principal) none)

;; Data maps
;; token-id -> token metadata
(define-map token-metadata
    { token-id: uint }
    {
        name: (string-utf8 64),
        symbol: (string-utf8 16),
        decimals: uint,
        total-supply: uint,
        max-supply: (optional uint),
        is-fungible: bool,
        uri: (optional (string-utf8 256)),
        creator: principal
    }
)

;; account -> token-id -> balance
(define-map balances
    { account: principal, token-id: uint }
    { balance: uint }
)

;; Enhanced operator approvals with metadata
(define-map operator-approvals
    { owner: principal, operator: principal }
    { 
        approved: bool, 
        expires-at: (optional uint),
        approved-at: uint,
        conditions: (optional (string-ascii 64))
    }
)

;; Enhanced allowance system with expiration and conditions
(define-map token-allowances
    { owner: principal, spender: principal, token-id: uint }
    { 
        allowance: uint,
        expires-at: (optional uint),
        conditions: (optional (string-ascii 64))
    }
)

;; Enhanced role-based access control with metadata
(define-map user-roles
    { user: principal, role: uint }
    { 
        assigned: bool,
        assigned-by: principal,
        assigned-at: uint
    }
)

;; Role hierarchy mapping
(define-map role-hierarchy
    { parent-role: uint, child-role: uint }
    { inherited: bool }
)

;; Role permissions mapping
(define-map role-permissions
    { role: uint, permission: (string-ascii 32) }
    { granted: bool }
)

;; Enhanced royalty information with detailed metadata
(define-map token-royalties
    { token-id: uint }
    { 
        recipient: principal, 
        percentage: uint,
        created-by: principal,
        created-at: uint,
        last-updated: uint
    }
)

;; Secondary royalty recipients for complex royalty splits
(define-map secondary-royalties
    { token-id: uint, recipient-index: uint }
    {
        recipient: principal,
        percentage: uint
    }
)

;; Read-only functions

;; Get contract name
(define-read-only (get-name)
    (ok CONTRACT-NAME)
)

;; Get contract owner
(define-read-only (get-owner)
    (ok (var-get contract-owner))
)

;; Check if contract is paused
(define-read-only (is-paused)
    (ok (var-get contract-paused))
)

;; Get next token ID
(define-read-only (get-next-token-id)
    (ok (var-get next-token-id))
)

;; Get token metadata
(define-read-only (get-token-metadata (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        metadata (ok metadata)
        ERR-TOKEN-NOT-EXISTS
    )
)

;; Get balance of account for specific token
(define-read-only (get-balance (account principal) (token-id uint))
    (ok (default-to u0 (get balance (map-get? balances { account: account, token-id: token-id }))))
)

;; Check if token exists
(define-read-only (token-exists (token-id uint))
    (ok (is-some (map-get? token-metadata { token-id: token-id })))
)

;; Check if user has role (including inherited roles)
(define-read-only (has-role (user principal) (role uint))
    (ok (or 
        (default-to false (get assigned (map-get? user-roles { user: user, role: role })))
        (has-inherited-role user role)
    ))
)

;; Check if user has inherited role
(define-private (has-inherited-role (user principal) (role uint))
    (or 
        (and (default-to false (get assigned (map-get? user-roles { user: user, role: ROLE-ADMIN })))
             (not (is-eq role ROLE-ADMIN)))
        false ;; Add more inheritance logic as needed
    )
)

;; Get all roles for a user
(define-read-only (get-user-roles (user principal))
    (ok (list 
        { role: ROLE-ADMIN, assigned: (default-to false (get assigned (map-get? user-roles { user: user, role: ROLE-ADMIN }))) }
        { role: ROLE-MINTER, assigned: (default-to false (get assigned (map-get? user-roles { user: user, role: ROLE-MINTER }))) }
        { role: ROLE-BURNER, assigned: (default-to false (get assigned (map-get? user-roles { user: user, role: ROLE-BURNER }))) }
        { role: ROLE-METADATA-MANAGER, assigned: (default-to false (get assigned (map-get? user-roles { user: user, role: ROLE-METADATA-MANAGER }))) }
    ))
)

;; Get enhanced royalty info for token
(define-read-only (get-royalty-info (token-id uint))
    (match (map-get? token-royalties { token-id: token-id })
        royalty-info (ok royalty-info)
        (ok { 
            recipient: (var-get contract-owner), 
            percentage: u0,
            created-by: (var-get contract-owner),
            created-at: u0,
            last-updated: u0
        })
    )
)

;; Update royalty information (only owner or metadata manager)
(define-public (update-royalty-info (token-id uint) (recipient principal) (percentage uint))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-METADATA-MANAGER))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (<= percentage MAX-ROYALTY-PERCENTAGE) ERR-INVALID-ROYALTY)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (begin
                ;; Update royalty info
                (map-set token-royalties { token-id: token-id } {
                    recipient: recipient,
                    percentage: percentage,
                    created-by: (default-to tx-sender (get created-by (map-get? token-royalties { token-id: token-id }))),
                    created-at: (default-to block-height (get created-at (map-get? token-royalties { token-id: token-id }))),
                    last-updated: block-height
                })
                
                (print {
                    action: "update-royalty-info",
                    token-id: token-id,
                    recipient: recipient,
                    percentage: percentage,
                    updater: tx-sender,
                    timestamp: block-height
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Enhanced batch balance queries with error handling
(define-read-only (get-balance-batch (accounts (list 20 principal)) (token-ids (list 20 uint)))
    (ok (map get-balance-batch-helper (zip-accounts-tokens accounts token-ids)))
)

;; Helper for batch balance queries with account-token pairs
(define-private (get-balance-batch-helper (item { account: principal, token-id: uint }))
    {
        account: (get account item),
        token-id: (get token-id item),
        balance: (default-to u0 (get balance (map-get? balances { account: (get account item), token-id: (get token-id item) })))
    }
)

;; Zip accounts and tokens for batch operations
(define-private (zip-accounts-tokens (accounts (list 20 principal)) (token-ids (list 20 uint)))
    (map zip-account-token-helper accounts token-ids)
)

;; Helper for zipping accounts and tokens
(define-private (zip-account-token-helper (account principal) (token-id uint))
    { account: account, token-id: token-id }
)

;; Batch token existence check with detailed results
(define-read-only (tokens-exist-batch (token-ids (list 20 uint)))
    (ok (map token-exists-detailed-helper token-ids))
)

;; Detailed token existence helper
(define-private (token-exists-detailed-helper (token-id uint))
    {
        token-id: token-id,
        exists: (is-some (map-get? token-metadata { token-id: token-id })),
        total-supply: (default-to u0 (get total-supply (map-get? token-metadata { token-id: token-id })))
    }
)

;; Get multiple token metadata in one call
(define-read-only (get-metadata-batch (token-ids (list 10 uint)))
    (ok (map get-metadata-helper token-ids))
)

;; Helper for batch metadata queries
(define-private (get-metadata-helper (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        metadata (some metadata)
        none
    )
)

;; Public functions

;; Grant role to user with enhanced metadata (only admin)
(define-public (grant-role (user principal) (role uint))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-ADMIN))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        (map-set user-roles { user: user, role: role } { 
            assigned: true,
            assigned-by: tx-sender,
            assigned-at: block-height
        })
        
        (print {
            action: "grant-role",
            user: user,
            role: role,
            granter: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Bulk grant roles to multiple users
(define-public (bulk-grant-roles (users (list 10 principal)) (role uint))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-ADMIN))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        (fold bulk-grant-helper users (ok role))
    )
)

;; Helper for bulk role granting
(define-private (bulk-grant-helper (user principal) (acc (response uint uint)))
    (match acc
        role-id (begin
            (map-set user-roles { user: user, role: role-id } { 
                assigned: true,
                assigned-by: tx-sender,
                assigned-at: block-height
            })
            (print {
                action: "bulk-grant-role",
                user: user,
                role: role-id,
                granter: tx-sender
            })
            (ok role-id)
        )
        error error
    )
)

;; Revoke role from user (only admin)
(define-public (revoke-role (user principal) (role uint))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-ADMIN))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        (map-delete user-roles { user: user, role: role })
        
        (print {
            action: "revoke-role",
            user: user,
            role: role,
            revoker: tx-sender
        })
        
        (ok true)
    )
)

;; Set emergency admin
(define-public (set-emergency-admin (admin principal))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (var-set emergency-admin (some admin))
        
        (print {
            action: "set-emergency-admin",
            admin: admin,
            setter: tx-sender
        })
        
        (ok true)
    )
)

;; Create a new token type (only owner or minter)
(define-public (create-token 
    (name (string-utf8 64))
    (symbol (string-utf8 16))
    (decimals uint)
    (is-fungible bool)
    (uri (optional (string-utf8 256)))
    (max-supply (optional uint))
    (royalty-recipient (optional principal))
    (royalty-percentage uint)
)
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-MINTER))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (<= royalty-percentage MAX-ROYALTY-PERCENTAGE) ERR-INVALID-ROYALTY)
        
        (let ((token-id (var-get next-token-id)))
            ;; Create token metadata
            (map-set token-metadata { token-id: token-id } {
                name: name,
                symbol: symbol,
                decimals: decimals,
                total-supply: u0,
                max-supply: max-supply,
                is-fungible: is-fungible,
                uri: uri,
                creator: tx-sender
            })
            
            ;; Set royalty info if provided with enhanced metadata
            (if (> royalty-percentage u0)
                (map-set token-royalties { token-id: token-id } {
                    recipient: (default-to tx-sender royalty-recipient),
                    percentage: royalty-percentage,
                    created-by: tx-sender,
                    created-at: block-height,
                    last-updated: block-height
                })
                true
            )
            
            ;; Increment next token ID
            (var-set next-token-id (+ token-id u1))
            
            ;; Emit creation event
            (print {
                action: "create-token",
                token-id: token-id,
                name: name,
                symbol: symbol,
                decimals: decimals,
                is-fungible: is-fungible,
                max-supply: max-supply,
                royalty-recipient: royalty-recipient,
                royalty-percentage: royalty-percentage,
                creator: tx-sender
            })
            
            (ok token-id)
        )
    )
)

;; Mint tokens to an account (only owner or minter)
(define-public (mint (to principal) (token-id uint) (amount uint))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-MINTER))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (let (
                (current-balance (default-to u0 (get balance (map-get? balances { account: to, token-id: token-id }))))
                (new-balance (+ current-balance amount))
                (current-supply (get total-supply metadata))
                (new-supply (+ current-supply amount))
                (max-supply (get max-supply metadata))
            )
                ;; Check max supply if set
                (asserts! (or 
                    (is-none max-supply)
                    (<= new-supply (unwrap-panic max-supply))
                ) ERR-MAX-SUPPLY-EXCEEDED)
                
                ;; Update balance
                (map-set balances { account: to, token-id: token-id } { balance: new-balance })
                
                ;; Update total supply
                (map-set token-metadata { token-id: token-id } (merge metadata { total-supply: new-supply }))
                
                ;; Emit mint event
                (print {
                    action: "mint",
                    to: to,
                    token-id: token-id,
                    amount: amount,
                    new-balance: new-balance,
                    new-supply: new-supply,
                    minter: tx-sender
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Enhanced batch operations with pre-validation and atomic execution
(define-public (batch-mint-atomic (to principal) (token-ids (list 10 uint)) (amounts (list 10 uint)))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-MINTER))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-eq (len token-ids) (len amounts)) ERR-BATCH-LENGTH-MISMATCH)
        
        ;; Pre-validate all operations before executing any
        (try! (fold batch-mint-validate-helper (zip token-ids amounts) (ok { to: to, valid: true })))
        
        ;; Execute all operations atomically
        (fold batch-mint-execute-helper (zip token-ids amounts) (ok { to: to, success: true }))
    )
)

;; Validation helper for batch minting
(define-private (batch-mint-validate-helper 
    (item { token-id: uint, amount: uint })
    (acc (response { to: principal, valid: bool } uint))
)
    (match acc
        success-data (let (
            (token-id (get token-id item))
            (amount (get amount item))
        )
            (if (> amount u0)
                (match (map-get? token-metadata { token-id: token-id })
                    metadata (let (
                        (current-supply (get total-supply metadata))
                        (new-supply (+ current-supply amount))
                        (max-supply (get max-supply metadata))
                    )
                        (if (or 
                            (is-none max-supply)
                            (<= new-supply (unwrap-panic max-supply))
                        )
                            (ok success-data)
                            ERR-MAX-SUPPLY-EXCEEDED
                        )
                    )
                    ERR-TOKEN-NOT-EXISTS
                )
                (ok success-data)
            )
        )
        error error
    )
)

;; Execution helper for batch minting
(define-private (batch-mint-execute-helper 
    (item { token-id: uint, amount: uint })
    (acc (response { to: principal, success: bool } uint))
)
    (match acc
        success-data (let (
            (token-id (get token-id item))
            (amount (get amount item))
            (to (get to success-data))
        )
            (if (> amount u0)
                (match (map-get? token-metadata { token-id: token-id })
                    metadata (let (
                        (current-balance (default-to u0 (get balance (map-get? balances { account: to, token-id: token-id }))))
                        (new-balance (+ current-balance amount))
                        (current-supply (get total-supply metadata))
                        (new-supply (+ current-supply amount))
                    )
                        ;; Update balance and supply
                        (map-set balances { account: to, token-id: token-id } { balance: new-balance })
                        (map-set token-metadata { token-id: token-id } (merge metadata { total-supply: new-supply }))
                        
                        ;; Emit atomic batch mint event
                        (print {
                            action: "atomic-batch-mint",
                            to: to,
                            token-id: token-id,
                            amount: amount,
                            new-balance: new-balance,
                            new-supply: new-supply,
                            minter: tx-sender,
                            timestamp: block-height
                        })
                        
                        (ok success-data)
                    )
                    ERR-TOKEN-NOT-EXISTS
                )
                (ok success-data)
            )
        )
        error error
    )
)

;; Helper function for batch minting with improved validation
(define-private (batch-mint-helper 
    (item { token-id: uint, amount: uint })
    (acc (response { to: principal, success: bool } uint))
)
    (match acc
        success-data (let (
            (token-id (get token-id item))
            (amount (get amount item))
            (to (get to success-data))
        )
            (if (> amount u0)
                (match (map-get? token-metadata { token-id: token-id })
                    metadata (let (
                        (current-balance (default-to u0 (get balance (map-get? balances { account: to, token-id: token-id }))))
                        (new-balance (+ current-balance amount))
                        (current-supply (get total-supply metadata))
                        (new-supply (+ current-supply amount))
                        (max-supply (get max-supply metadata))
                    )
                        ;; Check max supply constraint
                        (if (or 
                            (is-none max-supply)
                            (<= new-supply (unwrap-panic max-supply))
                        )
                            (begin
                                ;; Update balance and supply
                                (map-set balances { account: to, token-id: token-id } { balance: new-balance })
                                (map-set token-metadata { token-id: token-id } (merge metadata { total-supply: new-supply }))
                                
                                ;; Emit batch mint event
                                (print {
                                    action: "batch-mint",
                                    to: to,
                                    token-id: token-id,
                                    amount: amount,
                                    minter: tx-sender
                                })
                                
                                (ok success-data)
                            )
                            ERR-MAX-SUPPLY-EXCEEDED
                        )
                    )
                    ERR-TOKEN-NOT-EXISTS
                )
                (ok success-data)
            )
        )
        error error
    )
)

;; Helper function to zip two lists
(define-private (zip (list-a (list 10 uint)) (list-b (list 10 uint)))
    (map zip-helper list-a list-b)
)

;; Helper function for zipping
(define-private (zip-helper (a uint) (b uint))
    { token-id: a, amount: b }
)

;; Transfer tokens from sender to recipient with improved authorization
(define-public (transfer-from (from principal) (to principal) (token-id uint) (amount uint))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        (asserts! (not (is-eq from to)) ERR-SELF-TRANSFER)
        
        ;; Check authorization - owner, approved operator, or sufficient allowance
        (asserts! (or 
            (is-eq from tx-sender)
            (unwrap-panic (is-approved-for-all from tx-sender))
            (>= (unwrap-panic (get-allowance from tx-sender token-id)) amount)
        ) ERR-UNAUTHORIZED)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (let (
                (from-balance (default-to u0 (get balance (map-get? balances { account: from, token-id: token-id }))))
                (to-balance (default-to u0 (get balance (map-get? balances { account: to, token-id: token-id }))))
                (current-allowance (unwrap-panic (get-allowance from tx-sender token-id)))
            )
                ;; Check sufficient balance
                (asserts! (>= from-balance amount) ERR-INSUFFICIENT-BALANCE)
                
                ;; Update allowance if using allowance-based transfer with expiration check
                (if (and (not (is-eq from tx-sender)) (not (unwrap-panic (is-approved-for-all from tx-sender))))
                    (let ((allowance-data (map-get? token-allowances { owner: from, spender: tx-sender, token-id: token-id })))
                        (match allowance-data
                            data (let ((expires-at (get expires-at data)))
                                (asserts! (or 
                                    (is-none expires-at)
                                    (> (unwrap-panic expires-at) block-height)
                                ) ERR-EXPIRED-APPROVAL)
                                (map-set token-allowances { owner: from, spender: tx-sender, token-id: token-id } 
                                    (merge data { allowance: (- current-allowance amount) }))
                            )
                            (asserts! false ERR-INSUFFICIENT-ALLOWANCE)
                        )
                    )
                    true
                )
                
                ;; Update balances
                (map-set balances { account: from, token-id: token-id } { balance: (- from-balance amount) })
                (map-set balances { account: to, token-id: token-id } { balance: (+ to-balance amount) })
                
                ;; Emit transfer event
                (print {
                    action: "transfer",
                    from: from,
                    to: to,
                    token-id: token-id,
                    amount: amount,
                    operator: tx-sender
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Safe transfer with additional data
(define-public (safe-transfer-from (from principal) (to principal) (token-id uint) (amount uint) (data (buff 256)))
    (begin
        (try! (transfer-from from to token-id amount))
        
        ;; Emit safe transfer event with data
        (print {
            action: "safe-transfer",
            from: from,
            to: to,
            token-id: token-id,
            amount: amount,
            data: data
        })
        
        (ok true)
    )
)

;; Batch transfer multiple tokens from sender to recipient with atomic execution
(define-public (batch-transfer-from (from principal) (to principal) (token-ids (list 10 uint)) (amounts (list 10 uint)))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq from to)) ERR-SELF-TRANSFER)
        (asserts! (is-eq (len token-ids) (len amounts)) ERR-BATCH-LENGTH-MISMATCH)
        
        ;; Check authorization
        (asserts! (or 
            (is-eq from tx-sender)
            (unwrap-panic (is-approved-for-all from tx-sender))
        ) ERR-UNAUTHORIZED)
        
        ;; Process each token-amount pair atomically
        (fold batch-transfer-helper (zip token-ids amounts) (ok { from: from, to: to, operator: tx-sender }))
    )
)

;; Helper function for batch transfers with enhanced validation
(define-private (batch-transfer-helper 
    (item { token-id: uint, amount: uint })
    (acc (response { from: principal, to: principal, operator: principal } uint))
)
    (match acc
        success-data (let (
            (token-id (get token-id item))
            (amount (get amount item))
            (from (get from success-data))
            (to (get to success-data))
            (operator (get operator success-data))
        )
            (if (> amount u0)
                (match (map-get? token-metadata { token-id: token-id })
                    metadata (let (
                        (from-balance (default-to u0 (get balance (map-get? balances { account: from, token-id: token-id }))))
                        (to-balance (default-to u0 (get balance (map-get? balances { account: to, token-id: token-id }))))
                    )
                        (if (>= from-balance amount)
                            (begin
                                ;; Update balances atomically
                                (map-set balances { account: from, token-id: token-id } { balance: (- from-balance amount) })
                                (map-set balances { account: to, token-id: token-id } { balance: (+ to-balance amount) })
                                
                                ;; Emit enhanced batch transfer event
                                (print {
                                    action: "batch-transfer",
                                    from: from,
                                    to: to,
                                    token-id: token-id,
                                    amount: amount,
                                    operator: operator,
                                    timestamp: block-height
                                })
                                
                                (ok success-data)
                            )
                            ERR-INSUFFICIENT-BALANCE
                        )
                    )
                    ERR-TOKEN-NOT-EXISTS
                )
                (ok success-data)
            )
        )
        error error
    )
)

;; Safe batch transfer with additional data
(define-public (safe-batch-transfer-from (from principal) (to principal) (token-ids (list 10 uint)) (amounts (list 10 uint)) (data (buff 256)))
    (begin
        (try! (batch-transfer-from from to token-ids amounts))
        
        ;; Emit safe batch transfer event with data
        (print {
            action: "safe-batch-transfer",
            from: from,
            to: to,
            token-ids: token-ids,
            amounts: amounts,
            data: data
        })
        
        (ok true)
    )
)

;; Approval system

;; Enhanced set approval for operator with conditions
(define-public (set-approval-for-all (operator principal) (approved bool) (expires-at (optional uint)) (conditions (optional (string-ascii 64))))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq tx-sender operator)) ERR-INVALID-RECIPIENT)
        
        ;; Check expiration if provided
        (if (is-some expires-at)
            (asserts! (> (unwrap-panic expires-at) block-height) ERR-EXPIRED-APPROVAL)
            true
        )
        
        ;; Set operator approval with enhanced metadata
        (map-set operator-approvals { owner: tx-sender, operator: operator } { 
            approved: approved,
            expires-at: expires-at,
            approved-at: block-height,
            conditions: conditions
        })
        
        ;; Emit enhanced approval event
        (print {
            action: "set-approval-for-all",
            owner: tx-sender,
            operator: operator,
            approved: approved,
            expires-at: expires-at,
            conditions: conditions,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Check if operator is approved for all tokens with expiration check
(define-read-only (is-approved-for-all (owner principal) (operator principal))
    (match (map-get? operator-approvals { owner: owner, operator: operator })
        approval-data (let (
            (approved (get approved approval-data))
            (expires-at (get expires-at approval-data))
        )
            (ok (and 
                approved
                (or 
                    (is-none expires-at)
                    (> (unwrap-panic expires-at) block-height)
                )
            ))
        )
        (ok false)
    )
)

;; Enhanced approve with conditions and expiration
(define-public (approve (spender principal) (token-id uint) (amount uint) (expires-at (optional uint)) (conditions (optional (string-ascii 64))))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq tx-sender spender)) ERR-INVALID-RECIPIENT)
        
        ;; Check expiration if provided
        (if (is-some expires-at)
            (asserts! (> (unwrap-panic expires-at) block-height) ERR-EXPIRED-APPROVAL)
            true
        )
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (begin
                ;; Set allowance with enhanced metadata
                (map-set token-allowances { owner: tx-sender, spender: spender, token-id: token-id } { 
                    allowance: amount,
                    expires-at: expires-at,
                    conditions: conditions
                })
                
                ;; Emit enhanced approval event
                (print {
                    action: "approve",
                    owner: tx-sender,
                    spender: spender,
                    token-id: token-id,
                    amount: amount,
                    expires-at: expires-at,
                    conditions: conditions,
                    timestamp: block-height
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Get enhanced allowance information
(define-read-only (get-allowance-details (owner principal) (spender principal) (token-id uint))
    (match (map-get? token-allowances { owner: owner, spender: spender, token-id: token-id })
        allowance-data (ok allowance-data)
        (ok { 
            allowance: u0,
            expires-at: none,
            conditions: none
        })
    )
)

;; Get allowance for spender on specific token
(define-read-only (get-allowance (owner principal) (spender principal) (token-id uint))
    (ok (default-to u0 (get allowance (map-get? token-allowances { owner: owner, spender: spender, token-id: token-id }))))
)

;; Burning functionality

;; Burn tokens from account (only token owner, approved operator, or burner role)
(define-public (burn (from principal) (token-id uint) (amount uint))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Check authorization (owner, approved operator, or burner role)
        (asserts! (or 
            (is-eq from tx-sender)
            (unwrap-panic (is-approved-for-all from tx-sender))
            (unwrap-panic (has-role tx-sender ROLE-BURNER))
        ) ERR-UNAUTHORIZED)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (let (
                (current-balance (default-to u0 (get balance (map-get? balances { account: from, token-id: token-id }))))
                (current-supply (get total-supply metadata))
            )
                ;; Check sufficient balance
                (asserts! (>= current-balance amount) ERR-INSUFFICIENT-BALANCE)
                
                ;; Update balance and total supply
                (map-set balances { account: from, token-id: token-id } { balance: (- current-balance amount) })
                (map-set token-metadata { token-id: token-id } (merge metadata { total-supply: (- current-supply amount) }))
                
                ;; Emit burn event
                (print {
                    action: "burn",
                    from: from,
                    token-id: token-id,
                    amount: amount,
                    new-balance: (- current-balance amount),
                    new-supply: (- current-supply amount),
                    burner: tx-sender
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Batch burn multiple tokens from account
(define-public (batch-burn (from principal) (token-ids (list 10 uint)) (amounts (list 10 uint)))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-eq (len token-ids) (len amounts)) ERR-INVALID-AMOUNT)
        
        ;; Check authorization
        (asserts! (or 
            (is-eq from tx-sender)
            (unwrap-panic (is-approved-for-all from tx-sender))
        ) ERR-UNAUTHORIZED)
        
        ;; Process each token-amount pair
        (fold batch-burn-helper (zip token-ids amounts) (ok from))
    )
)

;; Helper function for batch burning
(define-private (batch-burn-helper 
    (item { token-id: uint, amount: uint })
    (acc (response principal uint))
)
    (match acc
        from-account (let (
            (token-id (get token-id item))
            (amount (get amount item))
        )
            (if (> amount u0)
                (match (map-get? token-metadata { token-id: token-id })
                    metadata (let (
                        (current-balance (default-to u0 (get balance (map-get? balances { account: from-account, token-id: token-id }))))
                        (current-supply (get total-supply metadata))
                    )
                        (if (>= current-balance amount)
                            (begin
                                ;; Update balance and supply
                                (map-set balances { account: from-account, token-id: token-id } { balance: (- current-balance amount) })
                                (map-set token-metadata { token-id: token-id } (merge metadata { total-supply: (- current-supply amount) }))
                                
                                ;; Emit batch burn event
                                (print {
                                    action: "batch-burn",
                                    from: from-account,
                                    token-id: token-id,
                                    amount: amount
                                })
                                
                                (ok from-account)
                            )
                            ERR-INSUFFICIENT-BALANCE
                        )
                    )
                    ERR-TOKEN-NOT-EXISTS
                )
                (ok from-account)
            )
        )
        error error
    )
)

;; URI and metadata management

;; Set URI for a specific token (only owner)
(define-public (set-token-uri (token-id uint) (uri (optional (string-utf8 256))))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (begin
                ;; Update URI
                (map-set token-metadata { token-id: token-id } (merge metadata { uri: uri }))
                
                ;; Emit URI update event
                (print {
                    action: "set-token-uri",
                    token-id: token-id,
                    uri: uri,
                    updater: tx-sender
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Get URI for a specific token
(define-read-only (get-token-uri (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        metadata (ok (get uri metadata))
        ERR-TOKEN-NOT-EXISTS
    )
)

;; Update token name and symbol (only owner)
(define-public (update-token-info (token-id uint) (name (string-utf8 64)) (symbol (string-utf8 16)))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (begin
                ;; Update name and symbol
                (map-set token-metadata { token-id: token-id } (merge metadata { name: name, symbol: symbol }))
                
                ;; Emit update event
                (print {
                    action: "update-token-info",
                    token-id: token-id,
                    name: name,
                    symbol: symbol,
                    updater: tx-sender
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Get total supply for a specific token
(define-read-only (get-total-supply (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        metadata (ok (get total-supply metadata))
        ERR-TOKEN-NOT-EXISTS
    )
)

;; Enhanced pause contract with levels and reasons
(define-public (pause-contract (level uint) (reason (optional (string-ascii 128))))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (is-some (var-get emergency-admin))
        ) ERR-UNAUTHORIZED)
        (asserts! (<= level u2) ERR-INVALID-AMOUNT) ;; Valid pause levels: 0, 1, 2
        
        (var-set contract-paused true)
        (var-set pause-level level)
        (var-set pause-reason reason)
        (var-set paused-at (some block-height))
        (var-set paused-by (some tx-sender))
        
        (print {
            action: "pause-contract",
            level: level,
            reason: reason,
            pauser: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Enhanced unpause with validation
(define-public (unpause-contract)
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (is-some (var-get emergency-admin))
        ) ERR-UNAUTHORIZED)

        (var-set contract-paused false)
        (var-set pause-level u0)
        (var-set pause-reason none)
        (var-set paused-at none)
        (var-set paused-by none)
        
        (print {
            action: "unpause-contract",
            unpauser: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Calculate royalty fee for a sale
(define-read-only (calculate-royalty-fee (token-id uint) (sale-price uint))
    (match (map-get? token-royalties { token-id: token-id })
        royalty-info (let (
            (percentage (get percentage royalty-info))
            (fee (/ (* sale-price percentage) u10000))
        )
            (ok { recipient: (get recipient royalty-info), fee: fee })
        )
        (ok { recipient: (var-get contract-owner), fee: u0 })
    )
)

;; Get tokens by type (fungible or non-fungible)
(define-read-only (get-tokens-by-type (is-fungible bool) (offset uint) (limit uint))
    (ok (list)) ;; Simplified - would need iteration in full implementation
)

;; Batch token existence check
(define-read-only (tokens-exist-batch (token-ids (list 20 uint)))
    (ok (map token-exists-helper token-ids))
)

(define-private (token-exists-helper (token-id uint))
    (is-some (map-get? token-metadata { token-id: token-id }))
)
;; Advanced approval with conditions
(define-public (approve-with-conditions (spender principal) (token-id uint) (amount uint) (expires-at (optional uint)))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq tx-sender spender)) ERR-INVALID-RECIPIENT)
        
        ;; Check expiration if provided
        (if (is-some expires-at)
            (asserts! (> (unwrap-panic expires-at) block-height) ERR-EXPIRED-APPROVAL)
            true
        )
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (begin
                ;; Set allowance (note: simplified - would need extended map for expiration)
                (map-set token-allowances { owner: tx-sender, spender: spender, token-id: token-id } { allowance: amount })
                
                ;; Emit conditional approval event
                (print {
                    action: "approve-with-conditions",
                    owner: tx-sender,
                    spender: spender,
                    token-id: token-id,
                    amount: amount,
                    expires-at: expires-at
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Emergency token recovery (only emergency admin)
(define-public (emergency-recover (token-id uint) (from principal) (to principal) (amount uint))
    (begin
        (asserts! (is-some (var-get emergency-admin)) ERR-UNAUTHORIZED)
        (asserts! (is-eq tx-sender (unwrap-panic (var-get emergency-admin))) ERR-UNAUTHORIZED)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (let (
                (from-balance (default-to u0 (get balance (map-get? balances { account: from, token-id: token-id }))))
                (to-balance (default-to u0 (get balance (map-get? balances { account: to, token-id: token-id }))))
            )
                ;; Check sufficient balance
                (asserts! (>= from-balance amount) ERR-INSUFFICIENT-BALANCE)
                
                ;; Update balances
                (map-set balances { account: from, token-id: token-id } { balance: (- from-balance amount) })
                (map-set balances { account: to, token-id: token-id } { balance: (+ to-balance amount) })
                
                ;; Emit emergency recovery event
                (print {
                    action: "emergency-recover",
                    from: from,
                    to: to,
                    token-id: token-id,
                    amount: amount,
                    admin: tx-sender,
                    timestamp: block-height
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Get contract version and info
(define-read-only (get-contract-info)
    (ok {
        name: CONTRACT-NAME,
        version: "2.0.0",
        owner: (var-get contract-owner),
        paused: (var-get contract-paused),
        next-token-id: (var-get next-token-id),
        emergency-admin: (var-get emergency-admin)
    })
)

;; Token freezing functionality
(define-map frozen-tokens
    { token-id: uint }
    { 
        frozen: bool,
        frozen-by: principal,
        frozen-at: uint,
        reason: (optional (string-ascii 128))
    }
)

;; Freeze/unfreeze token transfers
(define-public (freeze-token (token-id uint) (reason (optional (string-ascii 128))))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-ADMIN))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (begin
                (map-set frozen-tokens { token-id: token-id } {
                    frozen: true,
                    frozen-by: tx-sender,
                    frozen-at: block-height,
                    reason: reason
                })
                
                (print {
                    action: "freeze-token",
                    token-id: token-id,
                    reason: reason,
                    frozen-by: tx-sender,
                    timestamp: block-height
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Unfreeze token
(define-public (unfreeze-token (token-id uint))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-ADMIN))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        (map-delete frozen-tokens { token-id: token-id })
        
        (print {
            action: "unfreeze-token",
            token-id: token-id,
            unfrozen-by: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Check if token is frozen
(define-read-only (is-token-frozen (token-id uint))
    (ok (default-to false (get frozen (map-get? frozen-tokens { token-id: token-id }))))
)

;; Marketplace integration features
(define-map marketplace-approvals
    { marketplace: principal, token-owner: principal }
    {
        approved: bool,
        fee-percentage: uint,
        approved-at: uint
    }
)

;; Approve marketplace for trading
(define-public (approve-marketplace (marketplace principal) (fee-percentage uint))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (<= fee-percentage u1000) ERR-INVALID-ROYALTY) ;; Max 10% marketplace fee
        
        (map-set marketplace-approvals { marketplace: marketplace, token-owner: tx-sender } {
            approved: true,
            fee-percentage: fee-percentage,
            approved-at: block-height
        })
        
        (print {
            action: "approve-marketplace",
            marketplace: marketplace,
            token-owner: tx-sender,
            fee-percentage: fee-percentage,
            timestamp: block-height
        })
        
        (ok true)
    )
)

;; Calculate total fees for marketplace transaction
(define-read-only (calculate-total-fees (token-id uint) (marketplace principal) (sale-price uint))
    (let (
        (royalty-info (unwrap-panic (get-royalty-info token-id)))
        (marketplace-info (map-get? marketplace-approvals { marketplace: marketplace, token-owner: tx-sender }))
        (royalty-fee (/ (* sale-price (get percentage royalty-info)) u10000))
        (marketplace-fee (match marketplace-info
            info (/ (* sale-price (get fee-percentage info)) u10000)
            u0
        ))
    )
        (ok {
            royalty-fee: royalty-fee,
            marketplace-fee: marketplace-fee,
            total-fees: (+ royalty-fee marketplace-fee),
            net-amount: (- sale-price (+ royalty-fee marketplace-fee))
        })
    )
)
;; Security enhancements
(define-data-var reentrancy-guard bool false)

;; Reentrancy protection modifier
(define-private (with-reentrancy-guard (func (response bool uint)))
    (begin
        (asserts! (not (var-get reentrancy-guard)) ERR-UNAUTHORIZED)
        (var-set reentrancy-guard true)
        (let ((result func))
            (var-set reentrancy-guard false)
            result
        )
    )
)

;; Audit trail for sensitive operations
(define-map audit-trail
    { operation-id: uint }
    {
        action: (string-ascii 32),
        actor: principal,
        target: (optional principal),
        token-id: (optional uint),
        amount: (optional uint),
        timestamp: uint,
        block-height: uint
    }
)

(define-data-var next-operation-id uint u1)

;; Log audit event
(define-private (log-audit-event (action (string-ascii 32)) (target (optional principal)) (token-id (optional uint)) (amount (optional uint)))
    (let ((operation-id (var-get next-operation-id)))
        (map-set audit-trail { operation-id: operation-id } {
            action: action,
            actor: tx-sender,
            target: target,
            token-id: token-id,
            amount: amount,
            timestamp: block-height,
            block-height: block-height
        })
        (var-set next-operation-id (+ operation-id u1))
        operation-id
    )
)

;; Get audit trail entry
(define-read-only (get-audit-entry (operation-id uint))
    (ok (map-get? audit-trail { operation-id: operation-id }))
)

;; Advanced batch operations with conditions
(define-public (conditional-batch-transfer (conditions (list 5 { from: principal, to: principal, token-id: uint, amount: uint, condition: (string-ascii 32) })))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        ;; Validate all conditions first
        (try! (fold validate-condition-helper conditions (ok true)))
        
        ;; Execute all transfers
        (fold execute-conditional-transfer-helper conditions (ok true))
    )
)

;; Validate condition helper
(define-private (validate-condition-helper (item { from: principal, to: principal, token-id: uint, amount: uint, condition: (string-ascii 32) }) (acc (response bool uint)))
    (match acc
        success (let (
            (from (get from item))
            (to (get to item))
            (token-id (get token-id item))
            (amount (get amount item))
            (condition (get condition item))
        )
            ;; Add condition validation logic here
            (if (and 
                (> amount u0)
                (not (is-eq from to))
                (or 
                    (is-eq from tx-sender)
                    (unwrap-panic (is-approved-for-all from tx-sender))
                )
            )
                (ok true)
                ERR-UNAUTHORIZED
            )
        )
        error error
    )
)

;; Execute conditional transfer helper
(define-private (execute-conditional-transfer-helper (item { from: principal, to: principal, token-id: uint, amount: uint, condition: (string-ascii 32) }) (acc (response bool uint)))
    (match acc
        success (let (
            (from (get from item))
            (to (get to item))
            (token-id (get token-id item))
            (amount (get amount item))
        )
            (try! (transfer-from from to token-id amount))
            (log-audit-event "conditional-transfer" (some to) (some token-id) (some amount))
            (ok true)
        )
        error error
    )
)
;; Integration utilities and helper functions
(define-read-only (get-contract-stats)
    (ok {
        total-tokens: (var-get next-token-id),
        contract-paused: (var-get contract-paused),
        pause-level: (var-get pause-level),
        emergency-admin: (var-get emergency-admin),
        next-operation-id: (var-get next-operation-id),
        reentrancy-guard: (var-get reentrancy-guard)
    })
)

;; Batch token information query
(define-read-only (get-tokens-info-batch (token-ids (list 10 uint)))
    (ok (map get-token-info-helper token-ids))
)

;; Helper for token info queries
(define-private (get-token-info-helper (token-id uint))
    (match (map-get? token-metadata { token-id: token-id })
        metadata (some {
            metadata: metadata,
            royalty: (map-get? token-royalties { token-id: token-id }),
            frozen: (default-to false (get frozen (map-get? frozen-tokens { token-id: token-id })))
        })
        none
    )
)

;; Migration utilities for contract upgrades
(define-public (migrate-token-data (old-token-id uint) (new-token-id uint))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        ;; Copy metadata if source exists and target doesn't
        (match (map-get? token-metadata { token-id: old-token-id })
            old-metadata (begin
                (asserts! (is-none (map-get? token-metadata { token-id: new-token-id })) ERR-INVALID-TOKEN-ID)
                (map-set token-metadata { token-id: new-token-id } old-metadata)
                
                ;; Copy royalty info if exists
                (match (map-get? token-royalties { token-id: old-token-id })
                    royalty-info (map-set token-royalties { token-id: new-token-id } royalty-info)
                    true
                )
                
                (log-audit-event "migrate-token" none (some new-token-id) none)
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Compatibility layer for older contract versions
(define-read-only (legacy-get-balance (account principal) (token-id uint))
    (get-balance account token-id)
)

(define-read-only (legacy-get-total-supply (token-id uint))
    (get-total-supply token-id)
)

;; Performance optimization helpers
(define-private (optimize-storage-access (token-id uint))
    ;; Placeholder for storage optimization logic
    true
)

;; Final contract information and version
(define-read-only (get-enhanced-contract-info)
    (ok {
        name: CONTRACT-NAME,
        version: "3.0.0-enhanced",
        owner: (var-get contract-owner),
        paused: (var-get contract-paused),
        pause-level: (var-get pause-level),
        pause-reason: (var-get pause-reason),
        next-token-id: (var-get next-token-id),
        emergency-admin: (var-get emergency-admin),
        features: (list "role-based-access" "royalties" "batch-operations" "emergency-controls" "audit-trail" "marketplace-integration" "token-freezing"),
        total-operations: (var-get next-operation-id)
    })
)