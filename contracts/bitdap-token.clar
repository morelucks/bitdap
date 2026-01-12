;; title: Bitdap Token
;; version: 1.0.0
;; summary: ERC20-like fungible token for the Bitdap ecosystem
;; description: >
;;   Bitdap Token is a fungible token that implements ERC20-like functionality
;;   on the Stacks blockchain using Clarity. It provides standard token operations
;;   including transfers, approvals, minting, and burning.

;; SIP-010 trait for fungible tokens
(use-trait sip-010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)
(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant TOKEN-NAME "Bitdap Token")
(define-constant TOKEN-SYMBOL "BITDAP")
(define-constant TOKEN-DECIMALS u6)
(define-constant TOKEN-MAX-SUPPLY u1000000000000) ;; 1 million tokens with 6 decimals

;; Error codes - Comprehensive categorized system
;; Validation Errors (100-199)
(define-constant ERR-INVALID-AMOUNT (err u101))
(define-constant ERR-INVALID-RECIPIENT (err u102))
(define-constant ERR-SELF-TRANSFER (err u103))
(define-constant ERR-ZERO-ADDRESS (err u104))
(define-constant ERR-INVALID-PARAMETER (err u105))

;; Authorization Errors (200-299)
(define-constant ERR-UNAUTHORIZED (err u201))
(define-constant ERR-NOT-OWNER (err u202))
(define-constant ERR-INSUFFICIENT-ALLOWANCE (err u203))
(define-constant ERR-FORBIDDEN-OPERATION (err u204))

;; Business Logic Errors (300-399)
(define-constant ERR-INSUFFICIENT-BALANCE (err u301))
(define-constant ERR-MAX-SUPPLY-EXCEEDED (err u302))
(define-constant ERR-CONTRACT-PAUSED (err u303))
(define-constant ERR-TRANSFER-FAILED (err u304))
(define-constant ERR-MINT-FAILED (err u305))
(define-constant ERR-BURN-FAILED (err u306))

;; Resource Errors (400-499)
(define-constant ERR-BATCH-SIZE-EXCEEDED (err u401))
(define-constant ERR-RATE-LIMIT-EXCEEDED (err u402))
(define-constant ERR-OPERATION-LIMIT-EXCEEDED (err u403))

;; System Errors (500-599)
(define-constant ERR-INTERNAL-ERROR (err u501))
(define-constant ERR-STATE-CORRUPTION (err u502))
(define-constant ERR-UNEXPECTED-ERROR (err u503))

;; Data variables
(define-data-var total-supply uint u0)
(define-data-var contract-owner principal CONTRACT-OWNER)
(define-data-var token-paused bool false)
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var operation-counter uint u0)
(define-data-var last-operation-block uint u0)
(define-data-var transfers-paused bool false)
(define-data-var minting-paused bool false)
(define-data-var burning-paused bool false)

;; Data maps
;; Principal -> balance
(define-map balances principal uint)

;; Owner -> Spender -> allowance
(define-map allowances { owner: principal, spender: principal } uint)

;; Rate limiting: Principal -> last operation block
(define-map last-operation-block principal uint)

;; Operation frequency tracking: Principal -> operation count in current block
(define-map operation-count { user: principal, block: uint } uint)

;; Private functions

;; Enhanced event emission with metadata
(define-private (emit-event (event-type (string-ascii 32)) (event-data (tuple (actor principal))))
    (let (
        (operation-id (+ (var-get operation-counter) u1))
        (current-block block-height)
    )
        (var-set operation-counter operation-id)
        (var-set last-operation-block current-block)
        (print (merge 
            {
                event-type: event-type,
                operation-id: operation-id,
                timestamp: current-block,
                block-height: current-block,
                transaction-sender: tx-sender
            }
            event-data
        ))
        true
    )
)

;; Check if amount is valid (greater than 0)
(define-private (is-valid-amount (amount uint))
    (> amount u0)
)

;; Check if contract is not paused
(define-private (is-not-paused)
    (not (var-get token-paused))
)

;; Check if transfers are not paused
(define-private (are-transfers-enabled)
    (and (is-not-paused) (not (var-get transfers-paused)))
)

;; Check if minting is not paused
(define-private (is-minting-enabled)
    (and (is-not-paused) (not (var-get minting-paused)))
)

;; Check if burning is not paused
(define-private (is-burning-enabled)
    (and (is-not-paused) (not (var-get burning-paused)))
)

;; Rate limiting check - max 10 operations per block per user
(define-private (check-rate-limit (user principal))
    (let (
        (current-block block-height)
        (current-count (default-to u0 (map-get? operation-count { user: user, block: current-block })))
    )
        (if (< current-count u10)
            (begin
                (map-set operation-count { user: user, block: current-block } (+ current-count u1))
                true
            )
            false
        )
    )
)

;; Enhanced validation for critical operations
(define-private (validate-critical-operation (amount uint) (recipient principal))
    (and
        (is-valid-amount amount)
        (not (is-eq recipient tx-sender))
        (check-rate-limit tx-sender)
    )
)

;; Get balance for a principal (returns 0 if not found)
(define-private (get-balance-or-default (account principal))
    (default-to u0 (map-get? balances account))
)

;; Get allowance for owner-spender pair (returns 0 if not found)
(define-private (get-allowance-or-default (owner principal) (spender principal))
    (default-to u0 (map-get? allowances { owner: owner, spender: spender }))
)

;; Set balance for a principal
(define-private (set-balance (account principal) (amount uint))
    (if (is-eq amount u0)
        (map-delete balances account)
        (map-set balances account amount)
    )
)

;; Set allowance for owner-spender pair
(define-private (set-allowance (owner principal) (spender principal) (amount uint))
    (if (is-eq amount u0)
        (map-delete allowances { owner: owner, spender: spender })
        (map-set allowances { owner: owner, spender: spender } amount)
    )
)

;; Public functions

;; SIP-010 required functions

;; Transfer tokens from sender to recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        ;; Check if transfers are enabled
        (asserts! (are-transfers-enabled) ERR-CONTRACT-PAUSED)
        ;; Enhanced validation
        (asserts! (validate-critical-operation amount recipient) ERR-INVALID-PARAMETER)
        (asserts! (is-eq sender tx-sender) ERR-UNAUTHORIZED)
        
        (let (
            (sender-balance (get-balance-or-default sender))
        )
            ;; Check sufficient balance
            (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)
            
            ;; Update balances
            (set-balance sender (- sender-balance amount))
            (set-balance recipient (+ (get-balance-or-default recipient) amount))
            
            ;; Emit enhanced event
            (emit-event "token-transfer" {
                actor: sender,
                recipient: recipient,
                amount: amount,
                sender-balance-after: (- sender-balance amount),
                recipient-balance-after: (+ (get-balance-or-default recipient) amount),
                memo: memo
            })
            
            (ok true)
        )
    )
)

;; Get token name
(define-read-only (get-name)
    (ok TOKEN-NAME)
)

;; Get token symbol
(define-read-only (get-symbol)
    (ok TOKEN-SYMBOL)
)

;; Get token decimals
(define-read-only (get-decimals)
    (ok TOKEN-DECIMALS)
)

;; Get balance of an account
(define-read-only (get-balance (account principal))
    (ok (get-balance-or-default account))
)

;; Get total supply
(define-read-only (get-total-supply)
    (ok (var-get total-supply))
)

;; Get token URI
(define-read-only (get-token-uri)
    (ok (var-get token-uri))
)

;; Additional ERC20-like functions

;; Approve spender to spend tokens on behalf of owner
(define-public (approve (spender principal) (amount uint))
    (begin
        ;; Check if contract is not paused
        (asserts! (is-not-paused) ERR-CONTRACT-PAUSED)
        ;; Enhanced validation
        (asserts! (not (is-eq spender tx-sender)) ERR-INVALID-RECIPIENT)
        (asserts! (check-rate-limit tx-sender) ERR-RATE-LIMIT-EXCEEDED)
        
        ;; Set allowance (amount is validated by being uint type)
        (set-allowance tx-sender spender amount)
        
        ;; Emit enhanced event
        (emit-event "token-approval" {
            actor: tx-sender,
            spender: spender,
            amount: amount,
            previous-allowance: (get-allowance-or-default tx-sender spender)
        })
        
        (ok true)
    )
)

;; Get allowance for owner-spender pair
(define-read-only (get-allowance (owner principal) (spender principal))
    (ok (get-allowance-or-default owner spender))
)

;; Transfer tokens from owner to recipient using allowance
(define-public (transfer-from (owner principal) (recipient principal) (amount uint) (memo (optional (buff 34))))
    (begin
        ;; Check if transfers are enabled
        (asserts! (are-transfers-enabled) ERR-CONTRACT-PAUSED)
        ;; Enhanced validation
        (asserts! (is-valid-amount amount) ERR-INVALID-AMOUNT)
        (asserts! (not (is-eq owner recipient)) ERR-SELF-TRANSFER)
        (asserts! (check-rate-limit tx-sender) ERR-RATE-LIMIT-EXCEEDED)
        
        (let (
            (owner-balance (get-balance-or-default owner))
            (current-allowance (get-allowance-or-default owner tx-sender))
        )
            ;; Check sufficient balance and allowance
            (asserts! (>= owner-balance amount) ERR-INSUFFICIENT-BALANCE)
            (asserts! (>= current-allowance amount) ERR-INSUFFICIENT-ALLOWANCE)
            
            ;; Update balances and allowance
            (set-balance owner (- owner-balance amount))
            (set-balance recipient (+ (get-balance-or-default recipient) amount))
            (set-allowance owner tx-sender (- current-allowance amount))
            
            ;; Emit enhanced event
            (emit-event "token-transfer-from" {
                actor: tx-sender,
                owner: owner,
                recipient: recipient,
                amount: amount,
                remaining-allowance: (- current-allowance amount),
                owner-balance-after: (- owner-balance amount),
                recipient-balance-after: (+ (get-balance-or-default recipient) amount),
                memo: memo
            })
            
            (ok true)
        )
    )
)

;; Mint new tokens (only contract owner)
(define-public (mint (recipient principal) (amount uint))
    (begin
        ;; Check if minting is enabled
        (asserts! (is-minting-enabled) ERR-CONTRACT-PAUSED)
        ;; Enhanced authorization check
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (asserts! (is-valid-amount amount) ERR-INVALID-AMOUNT)
        (asserts! (check-rate-limit tx-sender) ERR-RATE-LIMIT-EXCEEDED)
        
        (let (
            (current-supply (var-get total-supply))
            (new-supply (+ current-supply amount))
            (recipient-balance (get-balance-or-default recipient))
            (new-recipient-balance (+ recipient-balance amount))
        )
            ;; Check max supply
            (asserts! (<= new-supply TOKEN-MAX-SUPPLY) ERR-MAX-SUPPLY-EXCEEDED)
            
            ;; Update total supply and recipient balance
            (var-set total-supply new-supply)
            (set-balance recipient new-recipient-balance)
            
            ;; Emit enhanced event
            (emit-event "token-mint" {
                actor: tx-sender,
                recipient: recipient,
                amount: amount,
                new-supply: new-supply,
                previous-supply: current-supply,
                recipient-balance-before: recipient-balance,
                recipient-balance-after: new-recipient-balance
            })
            
            (ok true)
        )
    )
)

;; Burn tokens from sender's balance
(define-public (burn (amount uint))
    (begin
        ;; Check if burning is enabled
        (asserts! (is-burning-enabled) ERR-CONTRACT-PAUSED)
        (asserts! (is-valid-amount amount) ERR-INVALID-AMOUNT)
        (asserts! (check-rate-limit tx-sender) ERR-RATE-LIMIT-EXCEEDED)
        
        (let (
            (sender-balance (get-balance-or-default tx-sender))
            (current-supply (var-get total-supply))
            (new-supply (- current-supply amount))
            (new-sender-balance (- sender-balance amount))
        )
            ;; Check sufficient balance
            (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)
            
            ;; Update balance and total supply
            (set-balance tx-sender new-sender-balance)
            (var-set total-supply new-supply)
            
            ;; Emit enhanced event
            (emit-event "token-burn" {
                actor: tx-sender,
                amount: amount,
                new-supply: new-supply,
                previous-supply: current-supply,
                sender-balance-before: sender-balance,
                sender-balance-after: new-sender-balance
            })
            
            (ok true)
        )
    )
)

;; Transfer contract ownership (only current owner)
(define-public (transfer-ownership (new-owner principal))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (asserts! (check-rate-limit tx-sender) ERR-RATE-LIMIT-EXCEEDED)
        (let ((old-owner tx-sender))
            (var-set contract-owner new-owner)
            
            (emit-event "transfer-ownership" {
                actor: old-owner,
                old-owner: old-owner,
                new-owner: new-owner
            })
            
            (ok true)
        )
    )
)

;; Get contract owner
(define-read-only (get-contract-owner)
    (ok (var-get contract-owner))
)

;; Pause contract (only owner)
(define-public (pause)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (var-set token-paused true)
        
        (emit-event "global-pause" { actor: tx-sender })
        
        (ok true)
    )
)

;; Unpause contract (only owner)
(define-public (unpause)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (var-set token-paused false)
        
        (emit-event "global-unpause" { actor: tx-sender })
        
        (ok true)
    )
)

;; Set token URI (only owner)
(define-public (set-token-uri (new-uri (optional (string-utf8 256))))
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (asserts! (check-rate-limit tx-sender) ERR-RATE-LIMIT-EXCEEDED)
        (var-set token-uri new-uri)
        
        (emit-event "set-token-uri" {
            actor: tx-sender,
            new-uri: new-uri
        })
        
        (ok true)
    )
)

;; Get pause state
(define-read-only (is-paused)
    (ok (var-get token-paused))
)

;; Get current token URI
(define-read-only (get-current-uri)
    (ok (var-get token-uri))
)

;; Batch transfer function - transfer to multiple recipients
(define-public (batch-transfer (recipients (list 10 { recipient: principal, amount: uint })) (memo (optional (buff 34))))
    (begin
        (asserts! (are-transfers-enabled) ERR-CONTRACT-PAUSED)
        (asserts! (check-rate-limit tx-sender) ERR-RATE-LIMIT-EXCEEDED)
        (asserts! (<= (len recipients) u10) ERR-BATCH-SIZE-EXCEEDED)
        
        (let (
            (total-amount (fold + (map get-amount recipients) u0))
            (sender-balance (get-balance-or-default tx-sender))
        )
            (asserts! (>= sender-balance total-amount) ERR-INSUFFICIENT-BALANCE)
            
            ;; Process all transfers
            (map process-batch-transfer recipients)
            
            ;; Emit batch event
            (emit-event "batch-transfer" {
                actor: tx-sender,
                recipient-count: (len recipients),
                total-amount: total-amount,
                memo: memo
            })
            
            (ok true)
        )
    )
)

;; Helper function to get amount from recipient tuple
(define-private (get-amount (recipient-data { recipient: principal, amount: uint }))
    (get amount recipient-data)
)

;; Helper function to process individual batch transfer
(define-private (process-batch-transfer (recipient-data { recipient: principal, amount: uint }))
    (let (
        (recipient (get recipient recipient-data))
        (amount (get amount recipient-data))
    )
        (begin
            (set-balance tx-sender (- (get-balance-or-default tx-sender) amount))
            (set-balance recipient (+ (get-balance-or-default recipient) amount))
            true
        )
    )
)

;; Initialize contract with initial supply to deployer
(begin
    (let ((initial-supply u1000000000)) ;; 1000 tokens with 6 decimals
        (var-set total-supply initial-supply)
        (map-set balances CONTRACT-OWNER initial-supply)
        (print {
            action: "initialize",
            owner: CONTRACT-OWNER,
            initial-supply: initial-supply
        })
    )
)

;; Analytics and query functions

;; Get contract statistics
(define-read-only (get-contract-stats)
    (ok {
        total-supply: (var-get total-supply),
        max-supply: TOKEN-MAX-SUPPLY,
        contract-owner: (var-get contract-owner),
        is-paused: (var-get token-paused),
        transfers-paused: (var-get transfers-paused),
        minting-paused: (var-get minting-paused),
        burning-paused: (var-get burning-paused),
        operation-counter: (var-get operation-counter),
        last-operation-block: (var-get last-operation-block),
        supply-utilization: (/ (* (var-get total-supply) u100) TOKEN-MAX-SUPPLY),
        current-block: block-height
    })
)

;; Get pause status for all operations
(define-read-only (get-pause-status)
    (ok {
        global-pause: (var-get token-paused),
        transfers-paused: (var-get transfers-paused),
        minting-paused: (var-get minting-paused),
        burning-paused: (var-get burning-paused),
        transfers-enabled: (are-transfers-enabled),
        minting-enabled: (is-minting-enabled),
        burning-enabled: (is-burning-enabled)
    })
)

;; Get user operation count for current block (for rate limiting transparency)
(define-read-only (get-user-operation-count (user principal))
    (ok (default-to u0 (map-get? operation-count { user: user, block: block-height })))
)

;; Check if user can perform operation (rate limit check)
(define-read-only (can-user-operate (user principal))
    (ok (< (default-to u0 (map-get? operation-count { user: user, block: block-height })) u10))
)

;; Get comprehensive user info
(define-read-only (get-user-info (user principal))
    (ok {
        balance: (get-balance-or-default user),
        operations-this-block: (default-to u0 (map-get? operation-count { user: user, block: block-height })),
        can-operate: (< (default-to u0 (map-get? operation-count { user: user, block: block-height })) u10),
        last-operation-block: (default-to u0 (map-get? last-operation-block user))
    })
)

;; Granular pause controls (only owner)
(define-public (pause-transfers)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (var-set transfers-paused true)
        (emit-event "pause-transfers" { actor: tx-sender })
        (ok true)
    )
)

(define-public (unpause-transfers)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (var-set transfers-paused false)
        (emit-event "unpause-transfers" { actor: tx-sender })
        (ok true)
    )
)

(define-public (pause-minting)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (var-set minting-paused true)
        (emit-event "pause-minting" { actor: tx-sender })
        (ok true)
    )
)

(define-public (unpause-minting)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (var-set minting-paused false)
        (emit-event "unpause-minting" { actor: tx-sender })
        (ok true)
    )
)

(define-public (pause-burning)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (var-set burning-paused true)
        (emit-event "pause-burning" { actor: tx-sender })
        (ok true)
    )
)

(define-public (unpause-burning)
    (begin
        (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-OWNER)
        (var-set burning-paused false)
        (emit-event "unpause-burning" { actor: tx-sender })
        (ok true)
    )
)