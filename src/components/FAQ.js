import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const faqData = [
    {
        question: 'How does the mentoring process work?',
        answer: 'Our mentoring process is personalized and flexible. You\'ll be matched with a mentor based on your goals, experience level, and preferred learning style. You can schedule sessions at your convenience and communicate through our platform.'
    },
    {
        question: 'What are the mentor qualifications?',
        answer: 'Our mentors are experienced professionals with proven expertise in their fields. They undergo a thorough vetting process, including technical assessments and interviews. Many have years of industry experience and teaching background.'
    },
    {
        question: 'How much does mentoring cost?',
        answer: 'Mentoring costs vary depending on the mentor\'s experience and expertise. Rates typically range from $30-$150 per hour. You can see each mentor\'s hourly rate on their profile before booking.'
    },
    {
        question: 'Can I change my mentor?',
        answer: 'Yes, you can change your mentor at any time. If you feel your current mentor isn\'t the right fit, you can easily switch to another mentor through your dashboard without losing your progress or notes.'
    },
    {
        question: 'What if I need to cancel a session?',
        answer: 'We understand that plans can change. You can cancel or reschedule a session up to 24 hours before the scheduled time without any penalty. Late cancellations may be subject to a fee.'
    }
];

function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleQuestion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="space-y-4">
                {faqData.map((faq, index) => (
                    <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                        <button
                            onClick={() => toggleQuestion(index)}
                            className="w-full flex items-center justify-between p-4 sm:p-6 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="text-lg font-medium text-gray-900 dark:text-white">
                                {faq.question}
                            </span>
                            <FaChevronDown
                                className={`w-5 h-5 text-gray-500 transition-transform duration-200
                                         ${openIndex === index ? 'transform rotate-180' : ''}`}
                            />
                        </button>
                        
                        <div
                            className={`overflow-hidden transition-all duration-200 ease-in-out
                                     ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}
                        >
                            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-600 dark:text-gray-300">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FAQ;
