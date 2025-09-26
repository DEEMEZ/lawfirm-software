'use client'

import Link from 'next/link'
import {
  Scale,
  Users,
  FileText,
  Building2,
  Zap,
  Globe,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Star,
  Mail,
  Phone,
  Calendar,
  Database,
  Cloud,
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Scale,
      title: 'Case Management',
      description:
        'Efficiently organize and track all your legal cases with comprehensive case timelines and status updates.',
    },
    {
      icon: Users,
      title: 'Client Portal',
      description:
        'Provide clients secure access to their case information, documents, and real-time updates.',
    },
    {
      icon: FileText,
      title: 'Document Management',
      description:
        'Store, organize, and share legal documents securely with version control and access permissions.',
    },
    {
      icon: Calendar,
      title: 'Court Calendar',
      description:
        'Never miss a deadline with integrated calendar management and automated reminders.',
    },
    {
      icon: Database,
      title: 'Multi-Tenant Architecture',
      description:
        'Complete data isolation for each law firm with enterprise-grade security and scalability.',
    },
    {
      icon: Cloud,
      title: 'Cloud-Based',
      description:
        'Access your practice management system from anywhere with secure cloud infrastructure.',
    },
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Managing Partner',
      firm: 'Johnson & Associates',
      content:
        'This platform has revolutionized how we manage our cases. The client portal feature alone has improved our client satisfaction dramatically.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Senior Attorney',
      firm: 'Chen Legal Group',
      content:
        'The document management system is incredibly intuitive. We&apos;ve reduced our administrative time by 40% since switching.',
      rating: 5,
    },
    {
      name: 'Emily Davis',
      role: 'Law Firm Owner',
      firm: 'Davis Law Firm',
      content:
        'Outstanding support and a platform that actually understands the needs of modern law firms. Highly recommended.',
      rating: 5,
    },
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      price: 99,
      description: 'Perfect for small firms getting started',
      features: [
        'Up to 5 users',
        'Basic case management',
        'Document storage (10GB)',
        'Client portal',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      price: 199,
      description: 'Ideal for growing law firms',
      features: [
        'Up to 25 users',
        'Advanced case management',
        'Document storage (100GB)',
        'Court calendar integration',
        'Priority support',
        'Custom branding',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 399,
      description: 'For large firms with complex needs',
      features: [
        'Unlimited users',
        'Full feature access',
        'Unlimited storage',
        'API access',
        'Dedicated support',
        'Custom integrations',
      ],
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4 mr-2" />
                Trusted by 500+ Law Firms
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Modern Law Firm
                <span className="block text-blue-400">Management</span>
              </h1>
              <p className="mt-6 text-xl text-slate-300 max-w-2xl">
                Streamline your legal practice with our comprehensive,
                cloud-based platform. Manage cases, clients, and documents with
                enterprise-grade security.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="inline-flex items-center px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-all duration-200">
                  Watch Demo
                  <Globe className="ml-2 h-5 w-5" />
                </button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-slate-400">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  30-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                  Setup in minutes
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Scale className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="h-4 bg-white/20 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-white/10 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="h-3 bg-green-400/50 rounded w-16 mb-2"></div>
                      <div className="h-2 bg-white/20 rounded w-20"></div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="h-3 bg-blue-400/50 rounded w-20 mb-2"></div>
                      <div className="h-2 bg-white/20 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
              <Building2 className="h-4 w-4 mr-2" />
              Platform Features
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything You Need to Run Your Law Firm
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to
              manage your legal practice efficiently and professionally.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-6 transition-colors">
                  <feature.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Client Testimonials
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Trusted by Law Firms Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what legal professionals are saying about our platform and how
              it&apos;s transformed their practice.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">
                  &quot;{testimonial.content}&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')}
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {testimonial.role}, {testimonial.firm}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-medium mb-6">
              <BarChart3 className="h-4 w-4 mr-2" />
              Pricing Plans
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Choose the Perfect Plan for Your Firm
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible pricing options designed to grow with your practice. All
              plans include core features with no hidden fees.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl border-2 p-8 ${
                  plan.popular
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Law Firm?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of law firms that have already modernized their
            practice with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button className="inline-flex items-center px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-xl transition-all duration-200">
              Schedule Demo
              <Calendar className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">LawFirm Pro</span>
              </div>
              <p className="text-gray-400 mb-6">
                Modern law firm management platform trusted by legal
                professionals worldwide.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Status
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Training
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 LawFirm Pro. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
