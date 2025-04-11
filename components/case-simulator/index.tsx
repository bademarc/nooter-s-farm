"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './styles.module.css';

export default function CaseSimulator() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('home');
  const [userBalance, setUserBalance] = useState(1000); // Default starting balance
  const [userName, setUserName] = useState('Player1');
  
  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <div className={styles.caseSimulatorContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          CS:GO Case Simulator
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{userName}</div>
          <div className={styles.balance}>${userBalance.toFixed(2)}</div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {currentTab === 'home' && (
          <div className={styles.casesGrid}>
            <Link href="/case-simulator/open/1" className={styles.caseItem}>
              <div className={styles.caseImage}>
                {/* Replace with actual case image when assets are migrated */}
                <div className={styles.casePlaceholder}>Case 1</div>
              </div>
              <div className={styles.caseName}>Chroma Case</div>
              <div className={styles.casePrice}>$2.49</div>
            </Link>
            <Link href="/case-simulator/open/2" className={styles.caseItem}>
              <div className={styles.caseImage}>
                <div className={styles.casePlaceholder}>Case 2</div>
              </div>
              <div className={styles.caseName}>Danger Zone Case</div>
              <div className={styles.casePrice}>$1.99</div>
            </Link>
            <Link href="/case-simulator/open/3" className={styles.caseItem}>
              <div className={styles.caseImage}>
                <div className={styles.casePlaceholder}>Case 3</div>
              </div>
              <div className={styles.caseName}>Prisma Case</div>
              <div className={styles.casePrice}>$2.99</div>
            </Link>
          </div>
        )}

        {currentTab === 'shop' && (
          <div className={styles.shopContainer}>
            <h2>Shop</h2>
            <p>Buy more balance to open cases</p>
            <div className={styles.shopItems}>
              <div className={styles.shopItem}>
                <div className={styles.itemAmount}>$10.00</div>
                <Button className={styles.buyButton}>Buy</Button>
              </div>
              <div className={styles.shopItem}>
                <div className={styles.itemAmount}>$20.00</div>
                <Button className={styles.buyButton}>Buy</Button>
              </div>
              <div className={styles.shopItem}>
                <div className={styles.itemAmount}>$50.00</div>
                <Button className={styles.buyButton}>Buy</Button>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'users' && (
          <div className={styles.usersContainer}>
            <h2>Users</h2>
            <p>See what other users have unboxed</p>
            <div className={styles.usersList}>
              <div className={styles.userItem}>
                <div className={styles.userAvatar}></div>
                <div className={styles.userData}>
                  <div className={styles.userItemName}>User1</div>
                  <div className={styles.userItemDesc}>Unboxed: AWP | Dragon Lore</div>
                </div>
              </div>
              <div className={styles.userItem}>
                <div className={styles.userAvatar}></div>
                <div className={styles.userData}>
                  <div className={styles.userItemName}>User2</div>
                  <div className={styles.userItemDesc}>Unboxed: Butterfly Knife | Fade</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <Button 
          variant="ghost" 
          className={`${styles.navButton} ${currentTab === 'home' ? styles.active : ''}`}
          onClick={() => handleTabChange('home')}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`${styles.navButton} ${currentTab === 'shop' ? styles.active : ''}`}
          onClick={() => handleTabChange('shop')}
        >
          <ShoppingBag className="h-5 w-5" />
          <span>Shop</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`${styles.navButton} ${currentTab === 'users' ? styles.active : ''}`}
          onClick={() => handleTabChange('users')}
        >
          <Users className="h-5 w-5" />
          <span>Users</span>
        </Button>
      </footer>
    </div>
  );
} 