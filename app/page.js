"use client";
import { FaLinkedin, FaGithub } from 'react-icons/fa';
import Link from 'next/link';
import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ExamContext } from '../components/shared/ExamContext'; // adjust if path differs

const developers = [
  { name: "Md. Hasibur Rahman", designation: "Team Leader", role: "Backend-Frontend Developer", linkedin: "https://www.linkedin.com/in/hasibur-rahman17/", github: "Hasib-17" },
  { name: "Prof. Md Samsuzzaman", designation: "Supervisor", role: "Project Manager", linkedin: "https://www.linkedin.com/in/md-samsuzzaman-b17834129/", github: "md-samsuzzaman-b17834129" },
];

export default function Home() {
  const router = useRouter();

  // ✅ get from context
  const { examStarted, startTime, endTime, durationStr, startExam } = useContext(ExamContext);

  // Changed here: formatTime to 12-hour with AM/PM
  const formatTime = (date) => {
    if (!date) return '';
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <>
      <main className="min-h-screen">
        <div className="container mx-auto px-4 py-8">

          <div className='flex justify-between items-center max-w-5xl mx-auto mb-20 max-md:flex-col-reverse max-md:gap-5'>
            <div className='flex flex-col gap-6 items-start max-sm:gap-5 max-xs:gap-3'>
              <p className="text-7xl max-sm:text-6xl max-xs:text-4xl text-gray-400 font-bold text-center">Learn</p>
              <p className="text-7xl max-sm:text-6xl max-xs:text-4xl text-gray-500 font-bold text-center">Compete</p>
              <p className="text-7xl max-sm:text-6xl max-xs:text-4xl text-gray-600 font-bold text-center">Collaborate.</p>
            </div>
            <img
              src='/logo.png'
              alt='codegamy_logo'
              className='w-80 h-80 max-sm:w-64 max-sm:h-64 max-xs:w-48 max-xs:h-48 object-contain'
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/problems">
              <FeatureCard title="Problems" description="Dive into a vast array of coding problems to hone your skills and master various algorithms and data structures." />
            </Link>
            <Link href="/contests">
              <FeatureCard title="Contests" description="Put your skills to the test in our thrilling coding contests. Compete against top programmers and climb the leaderboard to showcase your talent." />
            </Link>
            <Link href="/interview">
              <FeatureCard title="Interview Prep" description="Ace your coding interviews with our curated collection of questions and resources tailored to help you succeed." />
            </Link>
            <Link href="/news">
              <FeatureCard title="News" description="Stay updated with the latest industry news, trends, and advancements in the world of technology and software development." />
            </Link>

            {/* ✅ Go to Exam button */}
            <div
              onClick={async () => {
                await startExam();
                router.push('/Exam');
              }}
              className="bg-light-2 text-dark-1 rounded-xl p-6 shadow-lg hover:bg-dark-1 hover:mt-[-7px] hover:text-white group transition-all ease-in cursor-pointer"
            >
              <h2 className="text-xl font-semibold mb-2 group-hover:underline">Go to Exam Arena</h2>
              <p className="text-gray-600 group-hover:text-gray-400 mb-2">
                {examStarted ? "Exam already started! Anti-cheat active." : "Start the exam. This will enable fullscreen and anti-cheat protection."}
              </p>
              {startTime && (
                <p className="text-sm text-gray-500 group-hover:text-gray-300">Start: {formatTime(startTime)}</p>
              )}
              {endTime && (
                <p className="text-sm text-gray-500 group-hover:text-gray-300">End: {formatTime(endTime)}</p>
              )}
              {durationStr && (
                <p className="text-sm text-gray-500 group-hover:text-gray-300">Duration: {durationStr}</p>
              )}
            </div>
          </div>

          <h2 className="text-3xl font-semibold text-center mt-20">Meet Our Developers</h2>
          <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto mt-8">
            {developers.map((developer) => (
              <DeveloperCard key={developer.name} {...developer} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-light-2 text-dark-1 rounded-xl p-6 shadow-lg hover:bg-dark-1 hover:mt-[-7px] hover:text-white group transition-all ease-in">
      <h2 className="text-xl font-semibold mb-4 group-hover:underline">{title}</h2>
      <p className="text-gray-600 group-hover:text-gray-400">{description}</p>
    </div>
  );
}

function DeveloperCard({ name, designation, role, linkedin, github }) {
  return (
    <div className='flex items-center w-full cursor-pointer group hover:ml-[15px] transition-all ease-in'>
      <div className='flex rounded-full w-28 h-28 max-sm:hidden p-2 bg-gray-200 z-10 group-hover:bg-gray-400 transition-all ease-in'>
        <img src={`https://avatars.githubusercontent.com/${github}`} alt={name} className='w-full h-full object-contain rounded-full' />
      </div>
      <div className='flex flex-grow flex-wrap gap-3 justify-between items-center bg-gray-100 py-4 px-12 ml-[-30px] rounded-r-full group-hover:bg-gray-900 transition-all ease-in'>
        <div className='flex flex-col'>
          <div className='flex items-center gap-2'>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-white">{name}</h3>
            <p className="text-gray-500 text-sm group-hover:text-gray-400">({designation})</p>
          </div>
          <p className="text-gray-700 group-hover:text-gray-300">{role}</p>
        </div>
        <div className='flex gap-5'>
          <Link href={linkedin} target="_blank" rel="noopener noreferrer" className="bg-gray-200 rounded-full p-3 group-hover:bg-gray-400 transition-all ease-in">
            <FaLinkedin className="w-8 h-8 max-sm:w-5 max-sm:h-5 text-blue-700 hover:text-blue-500" />
          </Link>
          <Link href={`https://github.com/${github}`} target="_blank" rel="noopener noreferrer" className="bg-gray-200 rounded-full p-3 group-hover:bg-gray-400 transition-all ease-in">
            <FaGithub className="w-8 h-8 max-sm:w-5 max-sm:h-5 text-gray-700 hover:text-gray-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}
