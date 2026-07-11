import { useState, ReactNode } from "react";

interface FAQItem {
  question: string;
  answer: ReactNode;
}

export function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "What is Securitas File Lock?",
      answer: (
        <p>
          Securitas File Lock is a free, open-source tool that allows you to encrypt any file or folder with a password. It generates a single <code>.enc</code> file which you can send to your friends, coworkers, or clients. They can then use the same app to decrypt it using the password.
        </p>
      ),
    },
    {
      question: "Where do my files and passwords go?",
      answer: (
        <p>
          <strong>Nowhere.</strong> Everything runs 100% locally on your machine. All cryptographic algorithms run locally in native code. No data, files, or passwords are ever uploaded to a server or transmitted over a network.
        </p>
      ),
    },
    {
      question: "Is there any pixel or data loss when encrypting images/videos?",
      answer: (
        <p>
          <strong>Absolutely not.</strong> Unlike messaging platforms that compress images, Securitas works directly with the file's raw binary bytes. It encrypts the exact bitstream using <strong>AES-256-GCM</strong>. Decryption restores the exact same file bit-for-bit, meaning there is zero pixel compression, color degradation, or metadata loss.
        </p>
      ),
    },
    {
      question: "What is the 'Secure Filenames' option?",
      answer: (
        <p>
          Normally, if you encrypt a file named <code>Payroll_July.xlsx</code>, the app downloads it as <code>Payroll_July.xlsx.enc</code>, which still reveals the filename. If you enable <strong>Secure Filenames</strong>, the app downloads the file under a randomized identifier (e.g. <code>enc_a89bc2.enc</code>). The original filename remains securely encrypted inside the file metadata and is restored only upon successful decryption.
        </p>
      ),
    },
    {
      question: "How do I share the encrypted file securely?",
      answer: (
        <div>
          <p>We recommend following the two-channel rule:</p>
          <ol>
            <li>Send the encrypted <code>.enc</code> file via your usual channel (Email, Slack, Google Drive, USB).</li>
            <li>Share the password separately using a different channel (e.g. phone call, SMS, or face-to-face).</li>
          </ol>
          <p>Never send the password and the encrypted file in the same message.</p>
        </div>
      ),
    },
    {
      question: "What if I forget the password?",
      answer: (
        <p>
          Because we do not store your password or have access to your keys, <strong>we cannot recover your files if you lose the password.</strong> Make sure to choose a password you can remember, or save it locally using our Activity Log (if enabled in settings).
        </p>
      ),
    },
    {
      question: "Why should I use the desktop app over the website?",
      answer: (
        <p>
          The desktop app uses native file pickers and runs outside of browser sandbox memory limits. It allows you to encrypt files or folders of any size (even multi-gigabyte structures) smoothly without crashing the app.
        </p>
      ),
    },
  ];

  return (
    <div className="panel animate-fade-in">
      <h2>Help & Frequently Asked Questions</h2>
      <p className="tip">
        Learn how Securitas protects your files and how to troubleshoot common issues.
      </p>

      <div className="faq-list">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className={`faq-item ${isOpen ? "faq-item--open" : ""}`}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <span>{faq.question}</span>
                <span className="faq-arrow">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && <div className="faq-answer">{faq.answer}</div>}
            </div>
          );
        })}
      </div>

      <div className="security-specs">
        <h3>Cryptographic Specifications</h3>
        <ul>
          <li><strong>Cipher:</strong> Advanced Encryption Standard (AES) with 256-bit key length in GCM (Galois/Counter Mode) for authenticated encryption.</li>
          <li><strong>Key Derivation Function:</strong> Argon2id (memory-hard, parameters: 64MB memory, 3 iterations, 1 parallelism) to secure passwords against brute-force GPU attacks.</li>
          <li><strong>Integrity Verification:</strong> AES-GCM guarantees file tampering is detected instantly, throwing an error if the file has been modified.</li>
        </ul>
      </div>
    </div>
  );
}
