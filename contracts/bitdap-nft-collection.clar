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