import Link from "next/link";
import Image from "next/image";

const BRANDON_PHOTO_URL = "https://www.dropbox.com/scl/fi/ijjswkfn81jd90cxpxsef/brandon-new-photo-2.png?rlkey=lb3xnmidlbiyclr0ujtsabol2&raw=1";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#2D4A43] rounded-xl flex items-center justify-center">
              <span className="text-[#C9A962] font-bold text-lg">H</span>
            </div>
            <span className="text-2xl font-bold text-[#2D4A43]">Harvey & Co<span className="text-[#C9A962]">.</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-gray-600 hover:text-[#2D4A43] transition-colors text-sm font-medium">
              Services
            </a>
            <a href="#about" className="text-gray-600 hover:text-[#2D4A43] transition-colors text-sm font-medium">
              About
            </a>
            <a href="#contact" className="text-gray-600 hover:text-[#2D4A43] transition-colors text-sm font-medium">
              Contact
            </a>
            <Link
              href="/intake/new"
              className="bg-[#2D4A43] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#3D5A53] transition-all hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 bg-gradient-to-b from-[#F5F3EF] to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#2D4A43]/10 text-[#2D4A43] px-4 py-2 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-[#C9A962] rounded-full animate-pulse"></span>
              Now accepting new clients for 2025 tax season
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[#2D4A43] mb-6 leading-tight tracking-tight">
              Tax preparation that puts
              <span className="text-[#C9A962]"> more money </span>
              in your pocket
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Expert tax services designed to maximize your refund. We find the credits
              and deductions others miss.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/intake/new"
                className="bg-[#2D4A43] text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#3D5A53] transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Your Return
              </Link>
              <a
                href="tel:7173192858"
                className="border-2 border-[#2D4A43] text-[#2D4A43] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#2D4A43] hover:text-white transition-all"
              >
                (717) 319-2858
              </a>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: "$5,000+", label: "Average refund" },
              { value: "400+", label: "Clients served" },
              { value: "10+", label: "Years experience" },
              { value: "100%", label: "Satisfaction" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#2D4A43]">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D4A43] mb-4">
              Services tailored to your needs
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We specialize in maximizing refunds for individuals and families through
              expert knowledge of tax credits and deductions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Individual Returns",
                description: "Personal tax preparation with meticulous attention to detail. We review your entire financial picture.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
              },
              {
                title: "Family Tax Credits",
                description: "EIC, Child Tax Credit, dependent care—we ensure your family gets every dollar you're entitled to.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
              {
                title: "Tax Planning",
                description: "Strategic advice to minimize your tax burden and keep more of what you earn, year after year.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
              },
            ].map((service, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl border border-gray-100 hover:border-[#C9A962]/30 hover:shadow-xl transition-all duration-300 bg-white"
              >
                <div className="w-12 h-12 bg-[#F5F3EF] rounded-xl flex items-center justify-center text-[#2D4A43] mb-6 group-hover:bg-[#2D4A43] group-hover:text-white transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#2D4A43] mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Refund Potential */}
      <section className="py-24 bg-[#2D4A43]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See what you could be getting
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Refund amounts vary based on income, filing status, and qualifying credits.
              Here&apos;s what many of our clients receive.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { amount: "$5,000+", desc: "Single filers with qualifying children" },
              { amount: "$9,000+", desc: "Married filing jointly with 2+ children" },
              { amount: "$10,000+", desc: "Families with 3+ qualifying children" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center hover:bg-white/15 transition-colors"
              >
                <div className="text-4xl md:text-5xl font-bold text-[#C9A962] mb-3">{item.amount}</div>
                <p className="text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-[#F5F3EF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2D4A43] mb-6">
                A different approach to taxes
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  After more than a decade as a mortgage loan officer, I&apos;ve reviewed
                  thousands of tax returns. What I discovered troubled me—so many hardworking
                  people were leaving money on the table.
                </p>
                <p>
                  I&apos;ve seen clients get ghosted by their tax preparers. I&apos;ve seen
                  returns filed incorrectly, missing credits that families desperately needed.
                </p>
                <p>
                  That&apos;s why I started Harvey & Co. When you work with us, you get
                  personalized attention, creative strategies to maximize your refund, and
                  someone who actually answers when you call.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-[#C9A962]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Licensed Professional</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-[#C9A962]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Phoenix, AZ</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative">
                {/* Modern gradient background */}
                <div className="absolute -inset-4 bg-gradient-to-br from-[#2D4A43] via-[#3D5A53] to-[#C9A962] rounded-[2rem] opacity-20 blur-2xl"></div>
                <div className="absolute -inset-1 bg-gradient-to-br from-[#2D4A43] to-[#C9A962] rounded-[2rem] opacity-30"></div>

                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#C9A962]/20 rounded-full blur-xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#2D4A43]/20 rounded-full blur-xl"></div>

                <div className="relative w-80 h-80 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/50">
                  <Image
                    src={BRANDON_PHOTO_URL}
                    alt="Brandon Harvey"
                    width={320}
                    height={320}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-[#2D4A43] to-[#3D5A53] text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                  <span className="text-[#C9A962]">Brandon</span> Harvey
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#2D4A43] mb-4">
            Ready to maximize your refund?
          </h2>
          <p className="text-gray-600 mb-10 text-lg">
            Complete our simple intake form to get started. No upfront payment required.
          </p>
          <Link
            href="/intake/new"
            className="inline-block bg-[#C9A962] text-[#2D4A43] px-10 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            Start Your Tax Return
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-[#F5F3EF]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2D4A43] mb-6">
                Get in touch
              </h2>
              <p className="text-gray-600 mb-10">
                Have questions? We&apos;re here to help. Reach out and we&apos;ll
                get back to you as soon as possible.
              </p>

              <div className="space-y-6">
                <a href="tel:7173192858" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <svg className="w-5 h-5 text-[#2D4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="text-[#2D4A43] font-medium group-hover:text-[#C9A962] transition-colors">(717) 319-2858</div>
                  </div>
                </a>

                <a href="mailto:team@harveynco.com" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <svg className="w-5 h-5 text-[#2D4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="text-[#2D4A43] font-medium group-hover:text-[#C9A962] transition-colors">team@harveynco.com</div>
                  </div>
                </a>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-[#2D4A43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Office</div>
                    <div className="text-[#2D4A43] font-medium">4331 N 12th St. Suite 103, Phoenix, AZ 85014</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-[#2D4A43] mb-2">
                Quick start
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                The fastest way to get started is through our online intake form.
                It takes just a few minutes.
              </p>
              <Link
                href="/intake/new"
                className="block w-full bg-[#2D4A43] text-white px-6 py-3.5 rounded-xl text-center font-semibold hover:bg-[#3D5A53] transition-colors"
              >
                Complete Intake Form
              </Link>
              <p className="text-gray-400 text-sm mt-4 text-center">
                Or call us at (717) 319-2858
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2D4A43] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-[#C9A962] rounded-xl flex items-center justify-center">
                  <span className="text-[#2D4A43] font-bold text-lg">H</span>
                </div>
                <h3 className="text-2xl font-bold">Harvey & Co<span className="text-[#C9A962]">.</span></h3>
              </div>
              <p className="text-gray-400 max-w-sm">
                Professional tax preparation services with a personal touch.
                Helping families maximize their refunds.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link href="/intake/new" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-gray-400">
                <li>(717) 319-2858</li>
                <li>team@harveynco.com</li>
                <li>Phoenix, AZ 85014</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Harvey & Co Financial Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
