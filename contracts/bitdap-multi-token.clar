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

;; Data variables
(define-data-var contract-owner principal CONTRACT-OWNER)
(define-data-var contract-paused bool false)
(define-data-var next-token-id uint u1)

;; Data maps
;; token-id -> token metadata
(define-map token-metadata
    { token-id: uint }
    {
        name: (string-utf8 64),
        symbol: (string-utf8 16),
        decimals: uint,
        total-supply: uint,
        is-fungible: bool,
        uri: (optional (string-utf8 256))
    }
)

;; account -> token-id -> balance
(define-map balances
    { account: principal, token-id: uint }
    { balance: uint }
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