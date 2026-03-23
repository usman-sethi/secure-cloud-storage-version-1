import { motion } from 'motion/react';

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Us</h1>
          <p className="text-xl text-slate-400 font-medium italic">
            "For Students - By Students"
          </p>
        </motion.div>

        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-white/5 border border-white/10"
          >
            <h2 className="text-2xl font-semibold mb-4 text-indigo-400">Our Mission</h2>
            <p className="text-slate-300 leading-relaxed text-lg">
              Our Mission is to create a fair, inclusive, and empowering environment for all computing students.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-white/5 border border-white/10"
          >
            <h2 className="text-2xl font-semibold mb-6 text-emerald-400">Our Aim</h2>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">1</span>
                <span>Provide equal participation for all semesters</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">2</span>
                <span>Encourage skills development and tech learning activities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">3</span>
                <span>Build unity among all computing departments</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">4</span>
                <span>Give freshers a voice and platform</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">5</span>
                <span>Organize workshops, competitions, and events without favouritism</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">6</span>
                <span>Promote a positive culture of respect, learning and representation</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
