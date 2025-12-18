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