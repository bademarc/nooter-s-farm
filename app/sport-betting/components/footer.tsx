import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-muted/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-1 text-xl font-bold">
              <span className="text-green-600 dark:text-green-400">Sports</span>
              <span>Bet</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Experience the thrill of sports betting with virtual currency. No real money, all the excitement.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Instagram className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Youtube className="h-4 w-4" />
                <span className="sr-only">YouTube</span>
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase">Sports</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sports/football" className="text-muted-foreground hover:text-foreground">
                  Football
                </Link>
              </li>
              <li>
                <Link href="/sports/basketball" className="text-muted-foreground hover:text-foreground">
                  Basketball
                </Link>
              </li>
              <li>
                <Link href="/sports/tennis" className="text-muted-foreground hover:text-foreground">
                  Tennis
                </Link>
              </li>
              <li>
                <Link href="/sports/cricket" className="text-muted-foreground hover:text-foreground">
                  Cricket
                </Link>
              </li>
              <li>
                <Link href="/sports/esports" className="text-muted-foreground hover:text-foreground">
                  Esports
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase">Newsletter</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Subscribe to our newsletter for the latest updates and promotions.
            </p>
            <div className="flex gap-2">
              <Input placeholder="Your email" type="email" className="h-9" />
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Mail className="mr-2 h-4 w-4" />
                <span>Subscribe</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SportsBet. All rights reserved.</p>
          <p className="mt-2">
            This platform is for entertainment purposes only. No real money is involved in any transactions.
          </p>
        </div>
      </div>
    </footer>
  )
}
