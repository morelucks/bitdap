'use client';

import { ThemeToggle } from '@/components/ThemeToggle';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1>Bitdap - NFT Pass Collection</h1>
        <ThemeToggle />
      </div>
      <p className={styles.description}>
        Tiered membership NFT collection on Stacks blockchain
      </p>
    </main>
  );
}
