import React from "react";
import Layout from "@theme/Layout";
import SpringCronGenerator from "../components/SpringCronGenerator";

export default function SpringCronGeneratorPage() {
    return (
        <Layout title="Spring Cron Expression Generator" description="Spring Cron Expression Generator">
            <SpringCronGenerator/>
        </Layout>
    );
}