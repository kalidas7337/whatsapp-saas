'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  IconMessageCircle,
  IconUsers,
  IconChartBar,
  IconRobot,
  IconShield,
  IconBolt,
  IconCalendar,
  IconApi,
  IconBrandWhatsapp,
  IconCheck,
  IconArrowRight,
  IconStar,
  IconFileInvoice,
  IconClock,
  IconWorld,
  IconDeviceAnalytics,
  IconMessages,
  IconUserPlus,
  IconBell,
  IconFileText,
  IconCalculator,
  IconBriefcase,
  IconReceipt,
  IconClipboardCheck,
} from '@tabler/icons-react'

export function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <IconBrandWhatsapp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CA Connect</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#usecases" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Use Cases
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5">
            <IconCalculator className="mr-1.5 h-3.5 w-3.5" />
            Built for CA Firms & Tax Professionals
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Manage Client Communication{' '}
            <span className="gradient-text">Effortlessly</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            The WhatsApp platform designed for Chartered Accountants, Tax Preparers, and Financial Professionals.
            Send ITR reminders, share documents, and manage client queries—all from one dashboard.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-base px-8" asChild>
              <Link href="/register">
                Start 14-Day Free Trial
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8" asChild>
              <Link href="#usecases">
                See How CAs Use It
              </Link>
            </Button>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-primary" />
              <span>Send bulk ITR reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-primary" />
              <span>Secure document sharing</span>
            </div>
          </div>
        </div>

        {/* Hero Image/Preview */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="relative rounded-2xl border bg-card p-2 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10" />
            <div className="rounded-xl bg-muted/50 aspect-[16/9] flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8 w-full max-w-3xl">
                <div className="col-span-2 bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <IconMessages className="h-5 w-5 text-primary" />
                    <span className="font-medium">Client Messages</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-muted rounded p-2 text-sm">📄 Please send my Form 16</div>
                    <div className="bg-primary/10 rounded p-2 text-sm ml-8">Sent! Please check.</div>
                    <div className="bg-muted rounded p-2 text-sm">When is ITR deadline?</div>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <IconBell className="h-5 w-5 text-primary" />
                    <span className="font-medium text-sm">Reminders</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-orange-600">
                      <IconClock className="h-3 w-3" />
                      ITR Due: Jul 31
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <IconCalendar className="h-3 w-3" />
                      GST: 20th
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '5,000+', label: 'CA Firms Trust Us' },
              { value: '50L+', label: 'ITR Reminders Sent' },
              { value: '99.9%', label: 'Message Delivery' },
              { value: '70%', label: 'Faster Client Response' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">
              Sound Familiar? 🤔
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Clients don't respond to ITR document requests",
              "Manually sending deadline reminders to 100s of clients",
              "Important messages lost in personal WhatsApp",
              "No way to track which client queries are pending",
              "Staff using personal numbers for client communication",
              "Missing compliance deadlines due to poor communication",
            ].map((pain, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <span className="text-destructive text-lg">✗</span>
                <span className="text-muted-foreground">{pain}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-xl font-medium">
              CA Connect solves all of this with{' '}
              <span className="gradient-text">one powerful platform</span>
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="border-y bg-card/50">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">Use Cases</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Built for Your Daily Workflow
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See how CA firms and tax professionals use CA Connect
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: IconFileInvoice,
                title: 'ITR Filing Reminders',
                description: 'Send bulk reminders before ITR deadlines. Auto-schedule messages for July 31st rush.',
                example: '"Dear Client, ITR deadline is July 31. Please share Form 16 to avoid penalty."',
              },
              {
                icon: IconReceipt,
                title: 'GST Return Alerts',
                description: 'Automated GST filing reminders on 11th, 13th, and 20th of every month.',
                example: '"GST 3B due on 20th. Please approve the return shared yesterday."',
              },
              {
                icon: IconFileText,
                title: 'Document Collection',
                description: 'Request and receive documents directly via WhatsApp. Track pending submissions.',
                example: '"Pending documents: Bank Statement, Investment Proof. Please share ASAP."',
              },
              {
                icon: IconClipboardCheck,
                title: 'Compliance Updates',
                description: 'Keep clients informed about new tax rules, deadlines, and compliance requirements.',
                example: '"New TDS rules effective from April 1. Read more: [link]"',
              },
              {
                icon: IconBriefcase,
                title: 'Invoice & Payment Reminders',
                description: 'Send professional fee reminders and payment receipts to clients.',
                example: '"Invoice #1234 for ₹15,000 is due. Pay via UPI: firm@upi"',
              },
              {
                icon: IconUsers,
                title: 'Team Collaboration',
                description: 'Assign client queries to team members. Track who is handling what.',
                example: 'Assign: "Rahul, please handle Mr. Sharma\'s TDS query"',
              },
            ].map((useCase, i) => (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <useCase.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-base">{useCase.description}</CardDescription>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm italic text-muted-foreground">
                    {useCase.example}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Everything a CA Firm Needs
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Professional tools designed specifically for financial professionals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: IconBell,
              title: 'Bulk Deadline Reminders',
              description: 'Send ITR, GST, TDS reminders to all clients with one click. Schedule in advance.',
            },
            {
              icon: IconRobot,
              title: 'Smart Auto-Replies',
              description: 'AI-powered responses for common queries like "What documents needed for ITR?"',
            },
            {
              icon: IconMessageCircle,
              title: 'Team Inbox',
              description: 'All client messages in one place. Assign queries to staff, track responses.',
            },
            {
              icon: IconChartBar,
              title: 'Client Analytics',
              description: 'See which clients opened messages, response rates, and pending queries.',
            },
            {
              icon: IconShield,
              title: 'Secure & Compliant',
              description: 'End-to-end encryption. Keep client communication separate from personal WhatsApp.',
            },
            {
              icon: IconApi,
              title: 'Tally Integration',
              description: 'Connect with Tally to auto-send invoices and payment reminders.',
            },
          ].map((feature, i) => (
            <Card key={i} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="border-y bg-card/50">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Get Started in 10 Minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: IconUserPlus,
                title: 'Sign Up & Connect',
                description: 'Create account and connect your WhatsApp Business number. We help with Meta verification.',
              },
              {
                step: '02',
                icon: IconUsers,
                title: 'Import Clients',
                description: 'Upload client list from Excel or sync with your practice management software.',
              },
              {
                step: '03',
                icon: IconMessages,
                title: 'Start Messaging',
                description: 'Send your first bulk ITR reminder or respond to client queries from the dashboard.',
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="text-7xl font-bold text-muted/30 absolute -top-4 left-1/2 -translate-x-1/2">
                  {item.step}
                </div>
                <div className="relative pt-12">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Plans for Every Practice Size
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From individual CAs to large firms with multiple branches
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: 'Individual CA',
              price: '₹999',
              period: '/month',
              description: 'Perfect for solo practitioners',
              features: [
                'Up to 200 clients',
                '1,000 messages/month',
                'Bulk reminders',
                'Auto-replies',
                'Email support',
              ],
              cta: 'Start Free Trial',
              popular: false,
            },
            {
              name: 'CA Firm',
              price: '₹2,499',
              period: '/month',
              description: 'For growing practices with staff',
              features: [
                'Up to 1,000 clients',
                '5,000 messages/month',
                '5 team members',
                'Team inbox & assignments',
                'Advanced analytics',
                'Priority support',
                'Tally integration',
              ],
              cta: 'Start Free Trial',
              popular: true,
            },
            {
              name: 'Enterprise',
              price: '₹4,999',
              period: '/month',
              description: 'For large firms & multiple branches',
              features: [
                'Unlimited clients',
                'Unlimited messages',
                'Unlimited team members',
                'Multi-branch support',
                'Custom integrations',
                'Dedicated account manager',
                'SLA guarantee',
                'On-premise option',
              ],
              cta: 'Contact Sales',
              popular: false,
            },
          ].map((plan, i) => (
            <Card key={i} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="px-4 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <IconCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include 14-day free trial. No credit card required.
        </p>
      </section>

      {/* Testimonials */}
      <section className="border-y bg-card/50">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Trusted by 5,000+ CA Firms
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "During ITR season, I used to spend 2 hours daily sending reminders. Now it takes 5 minutes. My clients actually respond on time!",
                author: 'CA Rajesh Kumar',
                role: 'Kumar & Associates, Mumbai',
                rating: 5,
              },
              {
                quote: "The team inbox changed how we work. My 3 staff members can handle 500+ client queries efficiently. No message gets missed.",
                author: 'CA Priya Sharma',
                role: 'Sharma Tax Consultants, Delhi',
                rating: 5,
              },
              {
                quote: "GST deadline reminders are a lifesaver. Client response rate improved from 40% to 85%. Worth every rupee.",
                author: 'CA Amit Patel',
                role: 'Patel & Co., Ahmedabad',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <Card key={i} className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <IconStar key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Common Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                question: 'Do I need WhatsApp Business API access?',
                answer: 'Yes, but we help you get it! We guide you through Meta verification (takes 2-3 days) or can use your existing WhatsApp Business API if you have one.',
              },
              {
                question: 'Can I send messages to clients who haven\'t messaged me first?',
                answer: 'Yes! With WhatsApp Business API, you can send template messages (like ITR reminders) to clients proactively. We provide pre-approved templates for common CA communications.',
              },
              {
                question: 'Is client data secure?',
                answer: 'Absolutely. All messages are end-to-end encrypted. We\'re compliant with data protection standards. Your client data is never shared or used for any other purpose.',
              },
              {
                question: 'Can my staff use this without seeing my personal chats?',
                answer: 'Yes! CA Connect is completely separate from personal WhatsApp. Staff only see business messages. You can control what each team member can access.',
              },
              {
                question: 'Does it integrate with Tally or other accounting software?',
                answer: 'Yes, we integrate with Tally for auto-sending invoices. We also support Excel import for client lists and can integrate with most practice management software.',
              },
              {
                question: 'What happens if I exceed my message limit?',
                answer: 'We\'ll notify you before you reach the limit. You can upgrade your plan or buy additional message packs. We never stop your critical messages without warning.',
              },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready for Stress-Free ITR Season?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join 5,000+ CA firms who have transformed their client communication.
              Start your free trial today—no credit card needed.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto text-base px-8" asChild>
                <Link href="/register">
                  Start 14-Day Free Trial
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8" asChild>
                <Link href="#pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              🎁 Special Offer: Get 2 months free on annual plans
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <IconBrandWhatsapp className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">CA Connect</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                WhatsApp communication platform built for Chartered Accountants and Tax Professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#usecases" className="hover:text-foreground transition-colors">Use Cases</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CA Connect. Made with ❤️ for Indian CA Community</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-foreground transition-colors">YouTube</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
