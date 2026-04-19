// Docs:
//   Document — https://docs.langchain.com/oss/javascript/langchain/documents
//   RecursiveCharacterTextSplitter — https://docs.langchain.com/oss/javascript/langchain/text_splitters

import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/classic/text_splitter";

const CORPUS: Array<{ id: string; text: string }> = [
  {
    id: "return-policy",
    text:
      "Our return policy gives you 30 days from the delivery date to request a refund. Items must be in their original packaging with the receipt. Digital goods and gift cards are non-refundable. Shipping fees are reimbursed only when the return is caused by a defect on our side.",
  },
  {
    id: "shipping",
    text:
      "Standard shipping inside the country takes 3 to 5 business days. Express shipping arrives in 1 to 2 business days for an extra fee. International orders ship in 7 to 14 business days, depending on customs clearance. Tracking numbers are emailed the day the order leaves the warehouse.",
  },
  {
    id: "warranty",
    text:
      "All electronics carry a 12-month manufacturer warranty from the purchase date. The warranty covers defects in materials and workmanship, but not physical damage, water damage, or unauthorized repairs. Warranty claims are processed by our support team within 5 business days after inspection.",
  },
  {
    id: "account",
    text:
      "Accounts are free to create and only require a valid email address. You can reset your password at any time from the login screen using the emailed reset link. Deleted accounts are held in a recovery state for 30 days, after which all associated data is permanently removed from our systems.",
  },
  {
    id: "payments",
    text:
      "We accept all major credit and debit cards, plus wallets like Apple Pay and Google Pay. Wire transfers are supported for business customers on request. Charges are captured the moment an order is confirmed and appear on your statement under the store's legal trade name within 48 hours.",
  },
];

export default async function run(): Promise<{ chunks: Document[] }> {
  const sourceDocs = CORPUS.map(
    (entry) =>
      new Document({
        pageContent: entry.text,
        metadata: { source: entry.id },
      }),
  );

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 180,
    chunkOverlap: 20,
  });

  const chunks = await splitter.splitDocuments(sourceDocs);

  return { chunks };
}
