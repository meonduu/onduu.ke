import { notFound } from "next/navigation";
import { StandardPage } from "../components";
import { ArticlePage, InsightsIndex } from "../article";
import { articles, articlesBySlug } from "../insights-data";
import { pages } from "../site-data";

export function generateStaticParams(){return [...Object.keys(pages).map(key=>({slug:key.split("/")})),{slug:["insights"]},...articles.map(a=>({slug:["insights",a.slug]}))]}

export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const key=slug.join("/");if(key==="insights")return {title:"Insights | Onduu",description:"Domains, DNS, business email — and the software that now acts through them. Written from running this layer in Kenya since 2005."};if(slug[0]==="insights"&&slug.length===2){const article=articlesBySlug.get(slug[1]);if(article)return {title:`${article.title} | Onduu`,description:article.lede}}const page=pages[key];if(!page)return {};return {title:`${page.title} | Onduu`,description:page.intro}}

export default async function ContentPage({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const key=slug.join("/");if(key==="insights")return <InsightsIndex/>;if(slug[0]==="insights"&&slug.length===2){const article=articlesBySlug.get(slug[1]);if(article)return <ArticlePage article={article}/>}const page=pages[key];if(!page)notFound();return <StandardPage page={page}/>}
