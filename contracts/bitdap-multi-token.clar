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

;; Create a new token type (only owner)
(define-public (create-token 
    (name (string-utf8 64))
    (symbol (string-utf8 16))
    (decimals uint)
    (is-fungible bool)
    (uri (optional (string-utf8 256)))
)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        
        (let ((token-id (var-get next-token-id)))
            ;; Create token metadata
            (map-set token-metadata { token-id: token-id } {
                name: name,
                symbol: symbol,
                decimals: decimals,
                total-supply: u0,
                is-fungible: is-fungible,
                uri: uri
            })
            
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
                creator: tx-sender
            })
            
            (ok token-id)
        )
    )
)

;; Mint tokens to an account (only owner)
(define-public (mint (to principal) (token-id uint) (amount uint))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Check if token exists
        (match (map-get? token-metadata { token-id: token-id })
            metadata (let (
                (current-balance (default-to u0 (get balance (map-get? balances { account: to, token-id: token-id }))))
                (new-balance (+ current-balance amount))
                (current-supply (get total-supply metadata))
                (new-supply (+ current-supply amount))
            )
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
                    new-supply: new-supply
                })
                
                (ok true)
            )
            ERR-TOKEN-NOT-EXISTS
        )
    )
)

;; Batch mint multiple tokens to an account (only owner)
(define-public (batch-mint (to principal) (token-ids (list 10 uint)) (amounts (list 10 uint)))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-UNAUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-eq (len token-ids) (len amounts)) ERR-INVALID-AMOUNT)
        
        ;; Process each token-amount pair
        (fold batch-mint-helper (zip token-ids amounts) (ok true))
    )
)

;; Helper function for batch minting
(define-private (batch-mint-helper 
    (item { token-id: uint, amount: uint })
    (acc (response bool uint))
)
    (match acc
        success (let (
            (token-id (get token-id item))
            (amount (get amount item))
        )
            (if (> amount u0)
                (match (map-get? token-metadata { token-id: token-id })
                    metadata (let (
                        (current-balance (default-to u0 (get balance (map-get? balances { account: tx-sender, token-id: token-id }))))
                        (new-balance (+ current-balance amount))
                        (current-supply (get total-supply metadata))
                        (new-supply (+ current-supply amount))
                    )
                        ;; Update balance and supply
                        (map-set balances { account: tx-sender, token-id: token-id } { balance: new-balance })
                        (map-set token-metadata { token-id: token-id } (merge metadata { total-supply: new-supply }))
                        (ok true)
                    )
                    ERR-TOKEN-NOT-EXISTS
                )
                (ok true)
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

;; Transfer tokens from sender to recipient
(define-public (transfer-from (from principal) (to principal) (token-id uint) (amount uint))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        (asserts! (not (is-eq from to)) ERR-SELF-TRANSFER)
        (asserts! (is-eq from tx-sender) ERR-UNAUTHORIZED) ;; For now, only owner can transfer their tokens
        
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
                
                ;; Emit transfer event
                (print {
                    action: "transfer",
                    from: from,
                    to: to,
                    token-id: token-id,
                    amount: amount
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

;; Batch transfer multiple tokens from sender to recipient
(define-public (batch-transfer-from (from principal) (to principal) (token-ids (list 10 uint)) (amounts (list 10 uint)))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq from to)) ERR-SELF-TRANSFER)
        (asserts! (is-eq from tx-sender) ERR-UNAUTHORIZED)
        (asserts! (is-eq (len token-ids) (len amounts)) ERR-INVALID-AMOUNT)
        
        ;; Process each token-amount pair
        (fold batch-transfer-helper (zip token-ids amounts) (ok { from: from, to: to }))
    )
)

;; Helper function for batch transfers
(define-private (batch-transfer-helper 
    (item { token-id: uint, amount: uint })
    (acc (response { from: principal, to: principal } uint))
)
    (match acc
        success-data (let (
            (token-id (get token-id item))
            (amount (get amount item))
            (from (get from success-data))
            (to (get to success-data))
        )
            (if (> amount u0)
                (match (map-get? token-metadata { token-id: token-id })
                    metadata (let (
                        (from-balance (default-to u0 (get balance (map-get? balances { account: from, token-id: token-id }))))
                        (to-balance (default-to u0 (get balance (map-get? balances { account: to, token-id: token-id }))))
                    )
                        (if (>= from-balance amount)
                            (begin
                                ;; Update balances
                                (map-set balances { account: from, token-id: token-id } { balance: (- from-balance amount) })
                                (map-set balances { account: to, token-id: token-id } { balance: (+ to-balance amount) })
                                
                                ;; Emit batch transfer event
                                (print {
                                    action: "batch-transfer",
                                    from: from,
                                    to: to,
                                    token-id: token-id,
                                    amount: amount
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

;; Set approval for operator to manage all tokens
(define-public (set-approval-for-all (operator principal) (approved bool))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq tx-sender operator)) ERR-INVALID-RECIPIENT)
        
        ;; Set operator approval
        (map-set operator-approvals { owner: tx-sender, operator: operator } { approved: approved })
        
        ;; Emit approval event
        (print {
            action: "set-approval-for-all",
            owner: tx-sender,
            operator: operator,
            approved: approved
        })
        
        (ok true)
    )
)

;; Check if operator is approved for all tokens
(define-read-only (is-approved-for-all (owner principal) (operator principal))
    (ok (default-to false (get approved (map-get? operator-approvals { owner: owner, operator: operator }))))
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

;; Burn tokens from account (only token owner or approved operator)
(define-public (burn (from principal) (token-id uint) (amount uint))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        
        ;; Check authorization (owner or approved operator)
        (asserts! (or 
            (is-eq from tx-sender)
            (unwrap-panic (is-approved-for-all from tx-sender))
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
                    new-supply: (- current-supply amount)
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