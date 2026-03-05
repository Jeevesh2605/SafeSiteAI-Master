export default function ContactPopup({ open, setOpen }) {
  if (!open) return null;

  const members = [
    {
      name: "Riya Bajpai",
      work:"AI Model Developer",
      summary: "Builds and optimizes machine learning and deep learning models.",
      img: "https://media.licdn.com/dms/image/v2/D4D03AQFj5phB09MIfQ/profile-displayphoto-shrink_800_800/B4DZYLBgHqHsAg-/0/1743941666332?e=1765411200&v=beta&t=9Gaj9qZS2id5heyHhM6bkIKcgA3oASsIpQrGsc551K4",
      linkedin: "https://www.linkedin.com/in/riya-bajpai/",
    },
    {
      name: "Mohd Farhan Ansari",
      work:"Frontend Developer",
      summary: "Creates modern UI, animations, and responsive layouts.",
      img: "https://media.licdn.com/dms/image/v2/D4E03AQEV99-HN-xVUQ/profile-displayphoto-crop_800_800/B4EZnfB0ZhJ0AI-/0/1760383420563?e=1765411200&v=beta&t=7cjQ8F2t5ljFmIF77DDA1sh9eISpyqMjw80AZ5nQtY4",
      linkedin: "https://www.linkedin.com/in/mohd-farhan-ansari-596101314/",
    },
    {
      name: "Mohd Nazeeb Mansoori",
      work:"Backend Developer",
      summary: "Builds APIs, databases, and backend logic.",
      img: "https://media.licdn.com/dms/image/v2/D5603AQHidKQQio9gvA/profile-displayphoto-crop_800_800/B56ZeIscSXHUAU-/0/1750345042244?e=1765411200&v=beta&t=Jqti3FZNETmD1HVjTafqw6wz6vb5XVfDiwMlMsYkLpg",
      linkedin: "https://www.linkedin.com/in/mohd-nazeeb-mansoori/",
    },
    {
      name: "Jeevesh Chaurasiya",
      work:"Cloud Engineer",
      summary: "Manages servers, cloud deployments, and infrastructure.",
      img: "https://media.licdn.com/dms/image/v2/D5635AQFuUcgh7Dftbw/profile-framedphoto-shrink_800_800/B56Zcs5MyjHEAg-/0/1748804881903?e=1764180000&v=beta&t=D6CA3V2Z3vFYgrwIBUEhHvCiM6Y4GF4mSBRNwSHOjek",
      linkedin: "https://www.linkedin.com/in/jeevesh-chaurasiya-794625273/",
    },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn overflow-hidden h-200">
      
      <div
        className="absolute inset-0  bg-black/20 overflow-y-hidden"
        onClick={() => setOpen(false)}
      ></div>

      
      <div className="relative bg-white/10 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl w-[90%] max-w-4xl border border-white/20">

        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Contact the Team</h2>
          <p className="text-gray-200 text-lg mt-1">SafeSite AI</p>
        </div>

        
        <div className="grid grid-cols-4 divide-x divide-white/20 text-center">

          {members.map((m, i) => (
            <div key={i} className="px-4 flex flex-col items-center">

              <img
                src={m.img}
                alt={m.name}
                className="w-16 h-16 rounded-xl object-cover shadow-md mb-3"
              />

              <h3 className="text-white font-semibold text-1xl">{m.name}</h3>
              <h3 className="text-white font-semibold text-sm">{m.work}</h3>

              <p className="text-gray-300 text-xs mt-2 leading-tight">
                {m.summary}
              </p>

              <a
                href={m.linkedin}
                target="_blank"
                className="mt-3 text-blue-300 hover:text-blue-500 transition flex items-center gap-1"
              >
                
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175A1.16 1.16 0 0 1 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zM3.743 5.202c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.52 1.248 1.327 1.248h.016zm4.908 8.212h2.4V9.359c0-.214.016-.428.08-.582.175-.428.57-.872 1.232-.872 0 0 1.232 0 1.232 1.248v4.243H15V9.25c0-2.248-1.2-3.293-2.798-3.293-1.295 0-1.873.7-2.197 1.19V6.169H7.651c.03.68 0 7.225 0 7.225z" />
                </svg>
                LinkedIn
              </a>

            </div>
          ))}

        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-8 w-full py-3 bg-black/40 text-white rounded-2xl border border-white/20 hover:bg-black/60 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
