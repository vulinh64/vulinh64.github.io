import React from "react";
import Layout from "@theme/Layout";
import TaxCalculator from "../components/TaxCalculator";

export default function TaxCalculatorPage() {
  return (
    <Layout title="Tính thuế TNCN" description="Tính thuế TNCN">
      <TaxCalculator />
    </Layout>
  );
}