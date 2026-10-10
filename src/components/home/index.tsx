import { Navbar } from "../navbar";
import { Hero } from "../hero";
import { LeadMagnet } from "../lead-magnet";
import { ParticipatingCompanies } from "../participatingCompanies";
import { Workflow } from "../workflow";
import { Footer } from "../footer";
export default function HomePage() {
    return (
        <>
        <Navbar />
        <Hero />
        <LeadMagnet />
        <ParticipatingCompanies />
        <Workflow />
        <Footer />
        </>
    )
}