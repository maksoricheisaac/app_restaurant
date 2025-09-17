import ContactHero from '@/components/customs/public/contact/hero';
import ContactForm from '@/components/customs/public/contact/contact-form';
import ContactInfo from '@/components/customs/public/contact/contact-info';
import { StructuredData } from '@/components/seo/structured-data';


export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StructuredData type="restaurant" />
      <ContactHero />
      
      {/* Contact Information */}
      <section id="contact-content" className="py-12 sm:py-16 lg:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
              <ContactForm />
              <ContactInfo />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}