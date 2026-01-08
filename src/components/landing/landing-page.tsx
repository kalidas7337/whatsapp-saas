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
  IconQrcode,
  IconUpload,
  IconFileSearch,
  IconBrandTally,
  IconRocket,
  IconTargetArrow,
  IconHeartHandshake,
  IconCloudUpload,
  IconListCheck,
  IconMessageDots,
  IconUsersGroup,
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
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
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
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <IconRocket className="mr-1.5 h-3.5 w-3.5" />
            The AI Weapon for Financial Soldiers
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            WhatsApp Automation for{' '}
            <span className="gradient-text">CA Firms</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Scan QR. Connect WhatsApp. Automate everything. Collect documents, send ITR reminders,
            and manage 500+ clients from one dashboard. <span className="font-semibold text-foreground">Reduce data entry time by 70%.</span>
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12" asChild>
              <Link href="/register">
                Start Free Trial
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12" asChild>
              <Link href="#how-it-works">
                <IconQrcode className="mr-2 h-4 w-4" />
                See How It Works
              </Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-primary" />
              <span>Connect via QR scan</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-primary" />
              <span>Tally integration</span>
            </div>
          </div>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="relative rounded-2xl border bg-card p-3 shadow-2xl">
            <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Left - Chat Interface */}
                <div className="md:col-span-2 bg-background rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <IconMessages className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Centralized Inbox</span>
                      <Badge variant="secondary" className="text-xs">23 unread</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconUsersGroup className="h-4 w-4" />
                      <span>Team View</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">RS</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Rahul Sharma</span>
                          <span className="text-xs text-muted-foreground">2m ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">📄 Sent Form 16 - Please check</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs">Document</Badge>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border-l-2 border-primary">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-medium">AP</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Amit Patel</span>
                          <span className="text-xs text-muted-foreground">15m ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">When is ITR deadline? Need to file urgently</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">Urgent</Badge>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">PD</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Priya Desai</span>
                          <span className="text-xs text-muted-foreground">1h ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">GST return approved ✓</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - Stats & Actions */}
                <div className="space-y-4">
                  <div className="bg-background rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-2 mb-3">
                      <IconChartBar className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">Today's Stats</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Messages</span>
                        <span className="font-semibold">127</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Documents</span>
                        <span className="font-semibold text-green-600">+23</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span className="font-semibold">4 min</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background rounded-xl p-4 shadow-sm border">
                    <div className="flex items-center gap-2 mb-3">
                      <IconBell className="h-5 w-5 text-orange-500" />
                      <span className="font-semibold text-sm">Deadlines</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 p-2 rounded bg-red-50 text-red-700">
                        <IconClock className="h-4 w-4" />
                        <span>ITR: Jul 31 (5 days)</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded bg-yellow-50 text-yellow-700">
                        <IconCalendar className="h-4 w-4" />
                        <span>GST 3B: 20th</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" size="sm">
                    <IconUpload className="mr-2 h-4 w-4" />
                    Send Bulk Reminder
                  </Button>
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
              { value: '70%', label: 'Less Data Entry Time', icon: IconClock },
              { value: '5,000+', label: 'CA Firms Trust Us', icon: IconUsers },
              { value: '50L+', label: 'Documents Collected', icon: IconFileText },
              { value: '99.9%', label: 'Delivery Rate', icon: IconTargetArrow },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
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
              Tired of This? 😤
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Chasing clients on personal WhatsApp for Form 16",
              "Manually sending ITR reminders to 500+ clients",
              "Documents scattered across multiple WhatsApp chats",
              "No idea which staff member talked to which client",
              "Clients ignoring your document collection requests",
              "Typing same replies for 'What's ITR deadline?' 100 times",
            ].map((pain, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <span className="text-destructive text-lg">✗</span>
                <span className="text-muted-foreground">{pain}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-12 p-6 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xl font-medium">
              CA Connect fixes all of this.{' '}
              <span className="gradient-text">One QR scan. Full automation.</span>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-y bg-card/50">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Setup in 3 Minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No complex API setup. No Meta verification wait. Just scan and go.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                icon: IconUserPlus,
                title: 'Sign Up',
                description: 'Create your free account in 30 seconds',
              },
              {
                step: '2',
                icon: IconQrcode,
                title: 'Scan QR Code',
                description: 'Open WhatsApp on phone, scan our QR code',
              },
              {
                step: '3',
                icon: IconCloudUpload,
                title: 'Import Clients',
                description: 'Upload Excel or sync from Tally',
              },
              {
                step: '4',
                icon: IconRocket,
                title: 'Go Live!',
                description: 'Send first bulk reminder instantly',
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="absolute -top-2 -left-2 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                  {item.step}
                </div>
                <div className="relative pt-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Try It Free - No Credit Card
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Built for How CAs Actually Work
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: IconMessageDots,
              title: 'Centralized Inbox',
              description: 'All client WhatsApp chats in one dashboard. Know who said what, when. No more scrolling through personal WhatsApp.',
              highlight: 'See full chat history',
            },
            {
              icon: IconCloudUpload,
              title: 'Auto Document Collection',
              description: 'Send document request → Client uploads via link → Auto-organized in folders. No manual downloading.',
              highlight: 'Clients upload directly',
            },
            {
              icon: IconBell,
              title: 'Bulk ITR/GST Reminders',
              description: 'One click to remind 500 clients about ITR deadline. Pre-built templates for Form 16, GST 3B, TDS.',
              highlight: 'Schedule in advance',
            },
            {
              icon: IconRobot,
              title: 'AI Auto-Replies',
              description: '"What documents for ITR?" - Let AI handle FAQs. Smart canned responses learn from your replies.',
              highlight: 'Saves 2+ hours daily',
            },
            {
              icon: IconUsersGroup,
              title: 'Team Accountability',
              description: 'See which staff member handled which client. Assign chats. Track response times. Full audit trail.',
              highlight: 'Know who did what',
            },
            {
              icon: IconBrandTally,
              title: 'Tally Integration',
              description: 'Auto-sync client list from Tally. Send invoices via WhatsApp. Payment reminders on autopilot.',
              highlight: 'No manual data entry',
            },
          ].map((feature, i) => (
            <Card key={i} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
              <CardHeader>
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-base">{feature.description}</CardDescription>
                <Badge variant="secondary" className="text-xs">
                  <IconCheck className="mr-1 h-3 w-3" />
                  {feature.highlight}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="border-y bg-card/50">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">Use Cases</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Automate Your Daily Tasks
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: IconFileInvoice,
                title: 'ITR Season Automation',
                tasks: [
                  'Bulk Form 16 collection requests',
                  'Auto-reminders before July 31',
                  'Document checklist per client',
                  'Filing confirmation messages',
                ],
                color: 'bg-blue-500',
              },
              {
                icon: IconReceipt,
                title: 'GST Compliance',
                tasks: [
                  'Monthly GSTR-3B reminders',
                  'Purchase/Sales data collection',
                  'E-way bill notifications',
                  'Reconciliation alerts',
                ],
                color: 'bg-orange-500',
              },
              {
                icon: IconFileSearch,
                title: 'Document Collection',
                tasks: [
                  'Bank statement requests',
                  'Investment proof gathering',
                  'PAN/Aadhaar collection',
                  'Auto-organized folders',
                ],
                color: 'bg-green-500',
              },
              {
                icon: IconBriefcase,
                title: 'Client Management',
                tasks: [
                  'Invoice & payment reminders',
                  'Fee collection follow-ups',
                  'New regulation updates',
                  'Birthday/anniversary wishes',
                ],
                color: 'bg-purple-500',
              },
            ].map((useCase, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className={`${useCase.color} text-white`}>
                  <div className="flex items-center gap-3">
                    <useCase.icon className="h-8 w-8" />
                    <CardTitle className="text-xl text-white">{useCase.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3">
                    {useCase.tasks.map((task, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <IconCheck className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple Pricing, Powerful Features
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: 'Starter',
              price: '₹999',
              period: '/month',
              description: 'For individual CAs',
              features: [
                'Up to 200 clients',
                '1,000 messages/month',
                'QR WhatsApp connection',
                'Bulk reminders',
                'Document collection',
                'Email support',
              ],
              cta: 'Start Free Trial',
              popular: false,
            },
            {
              name: 'Professional',
              price: '₹2,499',
              period: '/month',
              description: 'For CA firms with team',
              features: [
                'Up to 1,000 clients',
                '5,000 messages/month',
                '5 team members',
                'Team inbox & assignments',
                'AI auto-replies',
                'Tally integration',
                'Priority support',
                'Analytics dashboard',
              ],
              cta: 'Start Free Trial',
              popular: true,
            },
            {
              name: 'Enterprise',
              price: '₹4,999',
              period: '/month',
              description: 'For large firms',
              features: [
                'Unlimited clients',
                'Unlimited messages',
                'Unlimited team members',
                'Multi-branch support',
                'Custom integrations',
                'Dedicated manager',
                'SLA guarantee',
                'API access',
              ],
              cta: 'Contact Sales',
              popular: false,
            },
          ].map((plan, i) => (
            <Card key={i} className={`relative flex flex-col ${plan.popular ? 'border-primary border-2 shadow-xl scale-105' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="px-4 py-1 shadow-lg">Most Popular</Badge>
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
              <CardContent className="flex-1">
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
          All plans include 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </section>

      {/* Testimonials */}
      <section className="border-y bg-card/50">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              CAs Love CA Connect
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "ITR season used to be chaos. Now I send one bulk reminder and 80% clients respond with documents within 2 days. Data entry time reduced by 70%!",
                author: 'CA Rajesh Kumar',
                firm: 'Kumar & Associates, Mumbai',
                clients: '800+ clients',
                rating: 5,
              },
              {
                quote: "Finally my staff can handle client queries without accessing my personal WhatsApp. The team inbox is a game-changer. I know exactly who talked to whom.",
                author: 'CA Priya Sharma',
                firm: 'Sharma Tax Consultants, Delhi',
                clients: '500+ clients',
                rating: 5,
              },
              {
                quote: "The Tally integration alone is worth it. Client invoices go out automatically, payment reminders follow up. I've collected ₹3L more this quarter.",
                author: 'CA Amit Patel',
                firm: 'Patel & Co., Ahmedabad',
                clients: '1200+ clients',
                rating: 5,
              },
            ].map((testimonial, i) => (
              <Card key={i} className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <IconStar key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.firm}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{testimonial.clients}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20 md:py-28">
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
                question: 'How does the QR code WhatsApp connection work?',
                answer: 'Just like WhatsApp Web! Open WhatsApp on your phone, go to Linked Devices, and scan our QR code. Your WhatsApp is now connected to CA Connect. All messages sync automatically. No API setup, no Meta approval needed.',
              },
              {
                question: 'Is this legal? Will my WhatsApp get banned?',
                answer: 'Yes, it\'s completely safe. We use the same technology as WhatsApp Web. We don\'t spam or send unsolicited messages. You\'re messaging your own clients who already have your number saved. Thousands of CAs use this daily.',
              },
              {
                question: 'Can my staff see my personal WhatsApp chats?',
                answer: 'No! CA Connect only shows business messages from clients you add to the system. Your personal chats, family groups, etc. are completely private. Staff only see what you assign to them.',
              },
              {
                question: 'What happens if I exceed my message limit?',
                answer: 'We\'ll notify you at 80% usage. You can upgrade your plan or buy a message pack. We never block critical messages without warning. Important: template messages (reminders) count as 1 message each.',
              },
              {
                question: 'Does it integrate with Tally?',
                answer: 'Yes! We sync client master data from Tally, send invoices via WhatsApp, and automate payment reminders. Setup takes 5 minutes. Works with Tally Prime and Tally ERP 9.',
              },
              {
                question: 'Can I try before paying?',
                answer: 'Absolutely. 14-day free trial with full features. No credit card required. If it doesn\'t work for you, just stop using it. No questions asked.',
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
      <section className="border-t bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <IconHeartHandshake className="h-12 w-12 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready for Stress-Free ITR Season?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join 5,000+ CA firms who automated their WhatsApp communication.
              Start your free trial—setup takes 3 minutes.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8 h-12" asChild>
                <Link href="/register">
                  Start Free Trial
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12 bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
                <Link href="#pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">
              No credit card required • 14-day free trial • Cancel anytime
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
              <p className="text-sm text-muted-foreground mb-4">
                The AI Weapon for Financial Soldiers. WhatsApp automation built for CAs.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <IconShield className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">256-bit encrypted</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
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
