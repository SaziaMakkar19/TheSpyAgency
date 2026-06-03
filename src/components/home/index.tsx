import { Navbar } from "../navbar";
import { Hero } from "../hero";
import { ParticipatingCompanies } from "../participatingCompanies";
import { Workflow } from "../workflow";
export default function HomePage() {
    return (
        <>
        <Navbar />
        <Hero />
        <ParticipatingCompanies />
        <Workflow />
        </>
    )
}