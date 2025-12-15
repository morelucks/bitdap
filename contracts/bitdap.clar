;; title: Bitdap Pass
;; version: 0.1.0
;; summary: Bitdap Pass – tiered membership NFT collection on Stacks.
;; description: >
;;   Bitdap Pass is a non-fungible token (NFT) collection that represents
;;   access passes to the Bitdap ecosystem. Each pass belongs to a tier
;;   (Basic, Pro, or VIP), which can be used by off-chain services or
;;   other contracts to gate features and experiences.
;;
;;   Milestone 1 – Concept & Rules:
;;   - Collection name: Bitdap Pass
;;   - Tiers: Basic, Pro, VIP
;;   - 1 owner per token-id, non-fractional NFTs
;;   - Future milestones will define minting, transfer logic, and metadata
;;     for each tier.

;; traits
;; - To be defined in later milestones (e.g., SIP-009 NFT trait implementation).

;; token definitions
;; - Bitdap Pass uses uint token-ids (u1, u2, ...) to identify each NFT.
;; - Each token-id is associated with exactly one owner and one tier.
;;

;; constants
;; - Collection-wide configuration and tier identifiers.

(define-constant ERR-INVALID-TIER (err u100))
(define-constant ERR-NOT-FOUND (err u101))

;; Tiers are represented as uints for compact on-chain storage.
(define-constant TIER-BASIC u1)
(define-constant TIER-PRO   u2)
(define-constant TIER-VIP   u3)

;; data vars
;; - Global counters for token-ids and total supply.

;; Next token-id to mint (starts at u1).
(define-data-var next-token-id uint u1)

;; Total number of Bitdap Pass NFTs currently in circulation.
(define-data-var total-supply uint u0)

;; data maps
;; - Storage for token ownership, metadata, and per-tier supply.

;; token-id -> owner principal
(define-map token-owners
  { token-id: uint }
  { owner: principal })

;; token-id -> metadata (tier and optional off-chain URI)
(define-map token-metadata
  { token-id: uint }
  { tier: uint, uri: (optional (string-utf8 256)) })

;; tier -> current supply for that tier
(define-map tier-supplies
  { tier: uint }
  { supply: uint })

;; public functions
;;

;; read only functions
;;

;; private functions
;;

