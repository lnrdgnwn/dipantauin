import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 min-h-[calc(100vh-4rem)]">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h1 className="display-xl sm:text-5xl">Simple, transparent pricing</h1>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Choose the plan that's right for you and start saving today.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 mt-16 w-full">
        {/* Free Plan */}
        <div className="flex flex-col justify-between rounded-3xl border border-border bg-background p-8 shadow-sm">
          <div>
            <h3 className="display-sm text-2xl">Free</h3>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              Rp 0
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              Perfect for getting started with price tracking.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-primary" />
                <span>Track up to 5 products</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-primary" />
                <span>Price checks every 24 hours</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-primary" />
                <span>Email notifications</span>
              </li>
            </ul>
          </div>
          <Link href="/sign-up" className="mt-8">
            <Button variant="outline" className="w-full rounded-full h-12 text-md">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="flex flex-col justify-between rounded-3xl border-2 border-primary bg-muted/10 p-8 shadow-[var(--shadow-level-3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 rounded-bl-xl bg-primary px-4 py-1 text-xs font-semibold uppercase text-primary-foreground">
            Most Popular
          </div>
          <div>
            <h3 className="display-sm text-2xl">Pro</h3>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              Rp 49k
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
            <p className="mt-4 text-muted-foreground text-sm">
              For serious shoppers who want the best deals fast.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-primary" />
                <span className="font-medium">Track up to 25 products</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-primary" />
                <span className="font-medium">Price checks every hour</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-primary" />
                <span>Email & Telegram notifications</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-primary" />
                <span>Detailed price history charts</span>
              </li>
            </ul>
          </div>
          <Link href="/sign-up" className="mt-8">
            <Button className="w-full rounded-full h-12 text-md shadow-[var(--shadow-level-2)]">
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
