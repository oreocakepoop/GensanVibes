
import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { db } from '../firebase';
import { ref, query, limitToLast, get } from 'firebase/database';
import { Post, View } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import { iconUrls } from '../data/icons';

const LoadingSpinner: React.FC = () => (
    <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-4 border-brand-subtle border-t-brand-accent rounded-full"
    />
);

const ExamplePrompts: React.FC<{ onPromptClick: (prompt: string) => void }> = ({ onPromptClick }) => {
    const prompts = [
        "Suggest a budget-friendly lunch spot near the city plaza.",
        "Where can I find the best-tasting tuna panga?",
        "I'm looking for a quiet coffee shop with good Wi-Fi to work from.",
    ];
    return (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
            {prompts.map((prompt, i) => (
                <motion.button
                    key={i}
                    onClick={() => onPromptClick(prompt)}
                    className="px-3 py-1.5 bg-brand-bg border border-brand-border rounded-full text-sm text-brand-text-secondary hover:bg-brand-subtle hover:text-brand-text transition-colors"
                    whileHover={{ y: -2 }}
                >
                    "{prompt}"
                </motion.button>
            ))}
        </div>
    );
};

const FoodTripPlannerPage: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const [queryText, setQueryText] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!queryText.trim()) return;

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            // 1. Fetch recent posts to use as context
            const postsQuery = query(ref(db, 'posts'), limitToLast(100));
            const snapshot = await get(postsQuery);
            const postsData = snapshot.val() || {};
            const allRecentPosts: Post[] = Object.values(postsData);

            // 2. Filter for food-related posts
            const foodKeywords = ['food', 'restaurant', 'cafe', 'kain', 'eat', 'tuna', 'grill', 'coffee', 'milktea', 'lunch', 'dinner', 'dessert', 'snack'];
            const foodPosts = allRecentPosts.filter(post => {
                const content = `${post.title || ''} ${post.body || ''} ${(post.tags || []).join(' ')}`.toLowerCase();
                return foodKeywords.some(keyword => content.includes(keyword));
            }).slice(0, 30);

            const contextString = foodPosts.map(p => `- A post mentions: "${p.title ? p.title + ' - ' : ''}${p.body || ''}"`).join('\n');

            // 3. Call Gemini API
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemInstruction = "You are 'Kain Tayo!', a friendly and enthusiastic food guide for General Santos City, Philippines. Your goal is to give helpful, locally-aware food recommendations based on the user's request and information from community posts. Format your answer in a fun, conversational, and easy-to-read way using Markdown. Use headings, bold text for names, and bullet points. Never mention post IDs or anything that hints you are just processing raw data. Instead of saying 'a post mentions', say 'a local viber mentioned' or 'someone in the community shared'. Always respond in English.";
            
            const fullPrompt = `Based on the user's request and context from community posts, provide a food recommendation for Gensan.\n\nCOMMUNITY POSTS CONTEXT:\n${contextString}\n\nUSER REQUEST: "${queryText}"`;

            const result: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: { systemInstruction },
            });
            
            const responseText = result.text;
            const htmlContent = marked.parse(responseText);
            setResponse(htmlContent as string);

        } catch (err) {
            console.error("Error calling Gemini API:", err);
            setError("Sorry, I couldn't fetch a recommendation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <style>{`
                .prose-styles h2 { font-family: Lora, serif; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #162A2C; }
                .prose-styles h3 { font-family: Lora, serif; font-size: 1.25rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #162A2C; }
                .prose-styles p { margin-bottom: 1rem; line-height: 1.6; }
                .prose-styles ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                .prose-styles li { margin-bottom: 0.5rem; }
                .prose-styles strong { font-weight: 700; color: #162A2C; }
                .prose-styles a { color: #DCA278; text-decoration: underline; }
            `}</style>
            
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center p-8 bg-brand-surface rounded-xl border border-brand-border">
                <h1 className="text-4xl font-bold text-brand-text font-serif">Kain Tayo!</h1>
                <p className="text-lg text-brand-text-secondary mt-2 max-w-2xl mx-auto">Your AI food trip planner for Gensan, powered by community vibes.</p>
                <ExamplePrompts onPromptClick={(p) => setQueryText(p)} />
            </motion.div>

            <form onSubmit={handleSearch} className="mt-6 flex flex-col items-center gap-3">
                <textarea
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="e.g., Where can I find the best halo-halo?"
                    className="w-full max-w-3xl p-4 text-base bg-brand-surface text-brand-text border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all shadow-sm"
                    rows={2}
                    disabled={loading}
                />
                <motion.button
                    type="submit"
                    disabled={loading || !queryText.trim()}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-brand-accent text-brand-surface font-bold py-2.5 px-6 rounded-lg text-base transition-all disabled:bg-brand-border disabled:text-brand-text-secondary disabled:cursor-not-allowed"
                >
                    {loading ? 'Thinking...' : 'Find Food'}
                    {!loading && <img src={iconUrls.send} alt="search" className="w-5 h-5"/>}
                </motion.button>
            </form>

            <div className="mt-8 max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center p-12">
                            <LoadingSpinner />
                        </motion.div>
                    )}
                    {error && (
                        <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 bg-brand-accent-light text-brand-accent text-center font-semibold rounded-lg">
                           {error}
                        </motion.div>
                    )}
                    {response && (
                         <motion.div 
                            key="response" 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-brand-surface p-6 rounded-xl border border-brand-border shadow-md prose-styles"
                            dangerouslySetInnerHTML={{ __html: response }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FoodTripPlannerPage;
