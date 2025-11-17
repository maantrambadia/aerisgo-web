import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const FAQItem = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className="mb-3 overflow-hidden border-border/40 hover:border-primary/20 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base text-foreground">
                {question}
              </h3>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0"
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-muted-foreground mt-3 ml-11 leading-relaxed">
                  {answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

export default function FAQsTab() {
  const faqs = [
    {
      question: "How do I reach support team?",
      answer: "Contact our support team via the support@aerisgo.in.",
    },
    {
      question: "How do I change my flight booking?",
      answer:
        "Contact our support team via the support@aerisgo.in. Modifications depend on fare rules and availability.",
    },
    {
      question: "What is the baggage allowance?",
      answer:
        "Economy: 15kg check-in + 7kg cabin. Business: 30kg check-in + 10kg cabin. Excess charges apply.",
    },
    {
      question: "How do I check-in online?",
      answer:
        "Online check-in opens 24 hours before departure. Visit our website or use the app to check-in and get your boarding pass.",
    },
    {
      question: "Can I cancel my booking?",
      answer:
        "Yes, cancellations are subject to fare rules. Refunds may take 7-10 business days to process.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground">
          Find answers to common questions about our services
        </p>
      </div>

      <div className="space-y-0">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            index={index}
          />
        ))}
      </div>

      <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Our support team is here to help you with any queries you may
              have.
            </p>
            <a
              href="mailto:support@aerisgo.in"
              className="text-sm font-medium text-primary hover:underline"
            >
              Contact Support →
            </a>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
