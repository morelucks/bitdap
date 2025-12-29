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
(define-data-var contract-paused bool false)
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

;; owner -> operator -> approved (for all tokens)
(define-map operator-approvals
    { owner: principal, operator: principal }
    { approved: bool, expires-at: (optional uint) }
)

;; owner -> spender -> token-id -> allowance
(define-map token-allowances
    { owner: principal, spender: principal, token-id: uint }
    { allowance: uint }
)

;; Role-based access control
(define-map user-roles
    { user: principal, role: uint }
    { assigned: bool }
)

;; Royalty information
(define-map token-royalties
    { token-id: uint }
    { recipient: principal, percentage: uint }
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

;; Check if user has role
(define-read-only (has-role (user principal) (role uint))
    (ok (default-to false (get assigned (map-get? user-roles { user: user, role: role }))))
)

;; Get royalty info for token
(define-read-only (get-royalty-info (token-id uint))
    (match (map-get? token-royalties { token-id: token-id })
        royalty-info (ok royalty-info)
        (ok { recipient: (var-get contract-owner), percentage: u0 })
    )
)

;; Get multiple balances at once
(define-read-only (get-balance-batch (account principal) (token-ids (list 20 uint)))
    (ok (map get-balance-helper token-ids))
)

;; Helper for batch balance queries
(define-private (get-balance-helper (token-id uint))
    (default-to u0 (get balance (map-get? balances { account: tx-sender, token-id: token-id })))
)

;; Public functions

;; Grant role to user (only admin)
(define-public (grant-role (user principal) (role uint))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-ADMIN))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        (map-set user-roles { user: user, role: role } { assigned: true })
        
        (print {
            action: "grant-role",
            user: user,
            role: role,
            granter: tx-sender
        })
        
        (ok true)
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
            
            ;; Set royalty info if provided
            (if (> royalty-percentage u0)
                (map-set token-royalties { token-id: token-id } {
                    recipient: (default-to tx-sender royalty-recipient),
                    percentage: royalty-percentage
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

;; Batch mint multiple tokens to an account (only owner or minter)
(define-public (batch-mint (to principal) (token-ids (list 10 uint)) (amounts (list 10 uint)))
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (unwrap-panic (has-role tx-sender ROLE-MINTER))
        ) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-eq (len token-ids) (len amounts)) ERR-BATCH-LENGTH-MISMATCH)
        
        ;; Process each token-amount pair atomically
        (fold batch-mint-helper (zip token-ids amounts) (ok { to: to, success: true }))
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
                
                ;; Update allowance if using allowance-based transfer
                (if (and (not (is-eq from tx-sender)) (not (unwrap-panic (is-approved-for-all from tx-sender))))
                    (map-set token-allowances { owner: from, spender: tx-sender, token-id: token-id } 
                        { allowance: (- current-allowance amount) })
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

;; Set approval for operator to manage all tokens with optional expiration
(define-public (set-approval-for-all (operator principal) (approved bool) (expires-at (optional uint)))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq tx-sender operator)) ERR-INVALID-RECIPIENT)
        
        ;; Check expiration if provided
        (if (is-some expires-at)
            (asserts! (> (unwrap-panic expires-at) block-height) ERR-EXPIRED-APPROVAL)
            true
        )
        
        ;; Set operator approval
        (map-set operator-approvals { owner: tx-sender, operator: operator } { 
            approved: approved,
            expires-at: expires-at
        })
        
        ;; Emit approval event
        (print {
            action: "set-approval-for-all",
            owner: tx-sender,
            operator: operator,
            approved: approved,
            expires-at: expires-at
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

;; Approve spender for specific token amount
(define-public (approve (spender principal) (token-id uint) (amount uint))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq tx-sender spender)) ERR-INVALID-RECIPIENT)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (begin
                ;; Set allowance
                (map-set token-allowances { owner: tx-sender, spender: spender, token-id: token-id } { allowance: amount })
                
                ;; Emit approval event
                (print {
                    action: "approve",
                    owner: tx-sender,
                    spender: spender,
                    token-id: token-id,
                    amount: amount
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
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

;; Emergency pause/unpause functions
(define-public (pause-contract)
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (is-some (var-get emergency-admin))
        ) ERR-UNAUTHORIZED)
        
        (var-set contract-paused true)
        
        (print {
            action: "pause-contract",
            pauser: tx-sender,
            timestamp: block-height
        })
        
        (ok true)
    )
)

(define-public (unpause-contract)
    (begin
        (asserts! (or 
            (is-eq tx-sender (var-get contract-owner))
            (is-some (var-get emergency-admin))
        ) ERR-UNAUTHORIZED)
        
        (var-set contract-paused false)
        
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