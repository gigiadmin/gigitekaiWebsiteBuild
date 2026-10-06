#!/usr/bin/env python3
"""Build a dependency-free static GigitekAI public marketing site.

No API calls, environment variables, trackers, form submissions, authentication,
or client credentials are emitted into dist/. Run with: python3 scripts/build.py
"""
from __future__ import annotations

from datetime import date
from pathlib import Path
from shutil import rmtree
from textwrap import dedent

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist"
CURRENT_YEAR = date.today().year

NAV = [
    ("Services", "/services/"),
    ("AI Automation", "/services/ai-automation/"),
    ("Microsoft 365", "/services/microsoft-365/"),
    ("Security", "/services/cybersecurity/"),
    ("Resources", "/resources/"),
    ("About", "/about/"),
]

SERVICES = [
    {
        "name": "Managed IT Operations",
        "path": "/services/managed-it/",
        "tag": "Operate",
        "description": "A calmer daily technology operation with proactive support, endpoint care, backup oversight, and practical escalation paths.",
        "items": ["Managed helpdesk and user support", "Endpoint, patch, and asset visibility", "Backup and resilience operations", "Clear technology ownership"],
    },
    {
        "name": "Microsoft 365 Architecture",
        "path": "/services/microsoft-365/",
        "tag": "Modernize",
        "description": "Design and optimize Microsoft 365, Entra ID, Exchange Online, Teams, and collaboration systems around how your organization works.",
        "items": ["Tenant and identity architecture", "Teams and Exchange modernization", "M365 security and governance", "Migration and integration planning"],
    },
    {
        "name": "Governed AI Automation",
        "path": "/services/ai-automation/",
        "tag": "Accelerate",
        "description": "Turn repeatable operations into governed AI-enabled workflows that preserve accountability, security, and measurable business value.",
        "items": ["AI workflow discovery", "Agentic automation design", "Microsoft Copilot readiness", "Human approval and governance"],
    },
    {
        "name": "Cybersecurity & Resilience",
        "path": "/services/cybersecurity/",
        "tag": "Protect",
        "description": "Strengthen identity, endpoint, email, and recovery controls with Zero Trust thinking and operationally realistic safeguards.",
        "items": ["Security posture and risk reviews", "Identity and access hardening", "Email, endpoint, and backup protection", "Compliance-ready operating practices"],
    },
]

PAGES: dict[str, dict] = {
    "/": {
        "title": "GigitekAI | Managed IT + Governed AI",
        "description": "GigitekAI delivers managed IT, Microsoft 365 architecture, cybersecurity, cloud modernization, and governed AI automation for growing organizations.",
        "eyebrow": "AI-first managed services for ambitious organizations",
        "headline": "Managed IT + governed AI, without the complexity.",
        "lede": "Build a more secure, efficient technology foundation with Microsoft 365 expertise, practical AI automation, and managed support that scales with your business.",
        "kind": "home",
    },
    "/services/": {
        "title": "Services | GigitekAI",
        "description": "Explore GigitekAI managed IT, Microsoft 365, cybersecurity, cloud, and governed AI automation services.",
        "eyebrow": "Capabilities designed to compound",
        "headline": "One operating partner across IT, security, Microsoft 365, and AI.",
        "lede": "GigitekAI brings architecture, operational care, and automation together so technology becomes a practical business advantage—not an ongoing distraction.",
        "kind": "services",
    },
    "/services/managed-it/": {
        "title": "Managed IT Operations | GigitekAI",
        "description": "Managed IT operations, responsive support, endpoint care, and resilient daily technology operations from GigitekAI.",
        "eyebrow": "Managed IT operations",
        "headline": "A dependable technology operation for the work that cannot stop.",
        "lede": "GigitekAI helps teams reduce daily technology friction through accountable support, proactive care, and a roadmap that connects operational reliability to business growth.",
        "kind": "detail",
        "service": SERVICES[0],
    },
    "/services/microsoft-365/": {
        "title": "Microsoft 365 Architecture | GigitekAI",
        "description": "Microsoft 365, Entra ID, Teams, Exchange Online, and collaboration architecture for secure modern work.",
        "eyebrow": "Microsoft 365 architecture",
        "headline": "Modern work, deliberately designed.",
        "lede": "From Entra identity and Exchange Online to Teams collaboration and governance, GigitekAI applies enterprise architecture discipline to the Microsoft 365 foundation your business depends on.",
        "kind": "detail",
        "service": SERVICES[1],
    },
    "/services/ai-automation/": {
        "title": "Governed AI Automation | GigitekAI",
        "description": "Practical, governed AI automation and agentic workflow design for small and midsize organizations.",
        "eyebrow": "Governed AI automation",
        "headline": "Put AI to work where your team feels the friction most.",
        "lede": "GigitekAI designs practical AI workflows that reduce manual effort while keeping human oversight, security controls, and accountable business outcomes in place.",
        "kind": "detail",
        "service": SERVICES[2],
    },
    "/services/cybersecurity/": {
        "title": "Cybersecurity & Resilience | GigitekAI",
        "description": "Zero Trust-minded cybersecurity, identity protection, endpoint resilience, and risk reduction services from GigitekAI.",
        "eyebrow": "Cybersecurity & resilience",
        "headline": "Security that supports growth instead of slowing it down.",
        "lede": "GigitekAI aligns identity, endpoint, email, backup, and recovery controls into an operating model that is easier to manage and easier to explain.",
        "kind": "detail",
        "service": SERVICES[3],
    },
    "/about/": {
        "title": "About GigitekAI",
        "description": "Learn about GigitekAI's AI-first approach to managed IT, Microsoft 365, cybersecurity, and cloud modernization.",
        "eyebrow": "About GigitekAI",
        "headline": "Enterprise thinking. MSP speed. Human accountability.",
        "lede": "GigitekAI is an AI-first managed services firm built to help growing organizations modernize their technology operations without creating more complexity.",
        "kind": "about",
    },
    "/resources/": {
        "title": "Resources | GigitekAI",
        "description": "GigitekAI resources for Microsoft 365 modernization, cybersecurity, managed IT, and practical AI automation.",
        "eyebrow": "Practical technology insight",
        "headline": "A clearer way to make technology decisions.",
        "lede": "Start with focused guidance on Microsoft 365, cybersecurity, managed IT, and AI automation. New independent content publishing will be added after the API-free public foundation is live.",
        "kind": "resources",
    },
    "/insights/": {
        "title": "Insights | GigitekAI",
        "description": "GigitekAI insights on AI automation, Microsoft 365, cybersecurity, and modern IT operations.",
        "eyebrow": "Insights",
        "headline": "Useful perspective for technology leaders building what is next.",
        "lede": "This independent static release preserves the GigitekAI insight destination. Dynamic article publishing is intentionally excluded until a separate, secure content workflow is selected.",
        "kind": "resources",
    },
    "/kb/": {
        "title": "Knowledge Base | GigitekAI",
        "description": "GigitekAI technology knowledge base and practical Microsoft 365, security, and IT guidance.",
        "eyebrow": "Knowledge base",
        "headline": "A practical library for stronger technology operations.",
        "lede": "The previous database-backed knowledge base is intentionally not copied to this no-API release. Static public guides can be added as version-controlled Markdown or HTML content in a later phase.",
        "kind": "resources",
    },
    "/trust-center/": {
        "title": "Trust Center | GigitekAI",
        "description": "GigitekAI trust principles for security, privacy, resilience, and accountable AI operations.",
        "eyebrow": "Trust center",
        "headline": "Security, privacy, and accountability by design.",
        "lede": "GigitekAI approaches managed services and AI automation through Zero Trust principles, least privilege, measurable operational controls, and transparent ownership.",
        "kind": "trust",
    },
    "/support/": {
        "title": "Support | GigitekAI",
        "description": "Contact GigitekAI for managed IT, Microsoft 365, cybersecurity, and AI automation support.",
        "eyebrow": "Get in touch",
        "headline": "Need a technology conversation? Start here.",
        "lede": "This static release keeps contact pathways simple and dependable. Email or call GigitekAI to discuss managed IT, Microsoft 365, cybersecurity, cloud, or governed AI automation.",
        "kind": "contact",
    },
    "/contact/": {
        "title": "Contact GigitekAI",
        "description": "Contact GigitekAI to discuss managed IT, Microsoft 365 architecture, cybersecurity, cloud, and governed AI automation.",
        "eyebrow": "Contact GigitekAI",
        "headline": "Let’s make technology easier to run—and harder to compromise.",
        "lede": "The independent public site intentionally uses direct contact links. There is no form processor, CRM integration, or visitor tracking embedded in this release.",
        "kind": "contact",
    },
    "/privacy/": {
        "title": "Privacy | GigitekAI",
        "description": "GigitekAI privacy information for this independent static public site.",
        "eyebrow": "Privacy",
        "headline": "A minimal-data public site by design.",
        "lede": "This static website contains no account login, visitor form, analytics tracker, API call, or database-backed feature. Direct email and telephone links open your own email or calling application.",
        "kind": "legal",
    },
    "/terms-of-service/": {
        "title": "Terms of Service | GigitekAI",
        "description": "Terms for the independent GigitekAI static public website.",
        "eyebrow": "Terms of service",
        "headline": "Website information, not a service agreement.",
        "lede": "This public site provides general business information. Any managed-services, professional-services, or technology engagement remains subject to a separate written agreement.",
        "kind": "legal",
    },
    "/admin/": {
        "title": "Admin Portal Unavailable | GigitekAI",
        "description": "The former GigitekAI admin portal is not part of this static public release.",
        "eyebrow": "Independent public site",
        "headline": "The former admin portal is intentionally not included here.",
        "lede": "This static public release contains no login, session, API, database, or administrative functionality. Protected operations must be rebuilt separately with Entra authentication and a secure backend before they are reintroduced.",
        "kind": "admin",
    },
}

CSS = r'''
:root{--bg:#07111f;--bg2:#0b1c2e;--panel:#0d2539;--line:rgba(124,225,255,.18);--text:#effbff;--muted:#a9bdcb;--cyan:#00d4ff;--cyan2:#7deeff;--mint:#85f4c2;--violet:#b5a5ff;--max:1180px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55}a{color:inherit}a:focus-visible{outline:3px solid var(--cyan);outline-offset:3px} .shell{position:relative;overflow:hidden;background:radial-gradient(circle at 14% 2%,rgba(0,212,255,.15),transparent 31rem),radial-gradient(circle at 84% 4%,rgba(181,165,255,.14),transparent 32rem),linear-gradient(145deg,#07111f 0%,#08182a 48%,#060d18 100%)}.shell:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(118,231,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(118,231,255,.06) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(#000,transparent 62%);pointer-events:none}.wrap{position:relative;width:min(var(--max),calc(100% - 40px));margin-inline:auto}.skip{position:absolute;left:-999px;top:0}.skip:focus{left:10px;z-index:99;background:var(--cyan);color:#05202b;padding:10px 14px;border-radius:8px;font-weight:800}.notice{border-bottom:1px solid var(--line);background:rgba(2,14,25,.68);color:var(--cyan2);font-size:.79rem;text-align:center;padding:8px 14px}.nav{display:flex;align-items:center;justify-content:space-between;min-height:86px;gap:20px}.brand{display:flex;align-items:center;gap:11px;text-decoration:none;font-weight:850;letter-spacing:-.04em}.brand-mark{display:grid;place-items:center;width:37px;height:37px;border-radius:11px;background:linear-gradient(140deg,var(--cyan),#89b9ff);color:#05202b;box-shadow:0 0 35px rgba(0,212,255,.3)}.brand small{display:block;color:var(--muted);font-size:.61rem;font-weight:750;letter-spacing:.14em;text-transform:uppercase}.links{display:flex;align-items:center;gap:4px}.links a{padding:8px 10px;color:var(--muted);font-size:.88rem;text-decoration:none;border-radius:8px}.links a:hover{color:var(--text);background:rgba(255,255,255,.06)}.hero{min-height:550px;display:grid;grid-template-columns:1.08fr .92fr;align-items:center;gap:48px;padding:64px 0 84px}.eyebrow{display:inline-flex;border:1px solid rgba(0,212,255,.33);border-radius:99px;padding:7px 12px;color:var(--cyan2);font-size:.74rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase;background:rgba(8,43,64,.42)}h1{max-width:780px;margin:17px 0;font-size:clamp(3rem,6.9vw,5.7rem);line-height:.93;letter-spacing:-.072em}h2{margin:10px 0 14px;font-size:clamp(2.12rem,4.5vw,3.65rem);line-height:1.01;letter-spacing:-.06em}h3{letter-spacing:-.035em}.cyan{color:var(--cyan)}.lede{max-width:700px;color:#bed0dc;font-size:1.1rem}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 17px;border-radius:12px;text-decoration:none;font-weight:800;border:1px solid transparent;transition:transform .16s ease,background .16s ease}.button:hover{transform:translateY(-2px)}.button:active{transform:scale(.97)}.primary{color:#02202b;background:linear-gradient(135deg,var(--cyan),#94d9ff);box-shadow:0 16px 34px rgba(0,212,255,.18)}.secondary{border-color:rgba(125,238,255,.32);color:var(--cyan2);background:rgba(7,35,53,.62)}.hero-note{margin-top:16px;color:var(--muted);font-size:.83rem}.orbit{position:relative;min-height:374px;border:1px solid rgba(126,232,255,.25);border-radius:28px;overflow:hidden;background:linear-gradient(145deg,rgba(21,73,101,.58),rgba(4,20,34,.83));box-shadow:0 26px 80px rgba(0,0,0,.25)}.orbit:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 54% 50%,rgba(0,212,255,.24),transparent 24%),radial-gradient(circle at 80% 20%,rgba(181,165,255,.22),transparent 27%)}.orbit-title{position:absolute;top:22px;left:23px;color:var(--cyan2);font-size:.76rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:grid;place-items:center;width:120px;height:120px;border-radius:50%;text-align:center;font-weight:850;line-height:1.12;color:#04202d;background:radial-gradient(circle at 32% 28%,#effdff,var(--cyan) 56%,#52bfe5);box-shadow:0 0 0 19px rgba(0,212,255,.08),0 0 60px rgba(0,212,255,.42)}.node{position:absolute;width:130px;border:1px solid rgba(179,243,255,.35);border-radius:14px;background:rgba(4,24,39,.86);padding:12px;font-size:.79rem;box-shadow:0 15px 28px rgba(0,0,0,.21)}.node strong{display:block;color:var(--text);font-size:.86rem}.node span{color:var(--muted);font-size:.7rem}.node:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;background:var(--mint)}.node.n1{top:96px;left:31px}.node.n2{right:25px;top:135px}.node.n3{bottom:39px;right:76px}.line{position:absolute;height:2px;transform-origin:left;background:linear-gradient(90deg,rgba(0,212,255,.85),rgba(181,165,255,.2));box-shadow:0 0 14px rgba(0,212,255,.35)}.l1{width:143px;left:28%;top:52%;transform:rotate(160deg)}.l2{width:132px;left:53%;top:52%;transform:rotate(-29deg)}.l3{width:123px;left:53%;top:59%;transform:rotate(31deg)}.orbit-caption{position:absolute;bottom:17px;left:22px;right:22px;color:var(--muted);font-size:.75rem}.section{padding:78px 0}.section.alt{background:rgba(2,14,25,.4);border-block:1px solid rgba(124,225,255,.09)}.kicker{color:var(--cyan);font-size:.75rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.intro{max-width:720px;color:var(--muted);font-size:1.02rem}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-top:31px}.card{border:1px solid var(--line);border-radius:18px;padding:21px;background:linear-gradient(145deg,rgba(16,55,80,.72),rgba(6,22,37,.75));box-shadow:0 14px 40px rgba(0,0,0,.1)}.card-tag{color:var(--cyan);font-size:.7rem;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.card h3{font-size:1.2rem;margin:12px 0 9px}.card p{color:var(--muted);font-size:.9rem}.card ul{padding:0;margin:16px 0 0;list-style:none;display:grid;gap:8px}.card li{color:#d2e1e9;font-size:.83rem}.card li:before{content:"↗";color:var(--cyan);margin-right:7px;font-weight:800}.card a{display:inline-block;margin-top:18px;color:var(--cyan2);font-weight:800;font-size:.85rem;text-decoration:none}.split{display:grid;grid-template-columns:.95fr 1.05fr;gap:20px;margin-top:28px}.panel{border:1px solid var(--line);border-radius:20px;padding:25px;background:rgba(8,31,49,.67)}.panel p{color:var(--muted)}.steps{display:grid;gap:11px}.step{display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:start;border-top:1px solid rgba(255,255,255,.08);padding-top:12px}.step b{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:rgba(0,212,255,.14);color:var(--cyan);font-size:.78rem}.step strong{display:block;font-size:.9rem}.step span{display:block;color:var(--muted);font-size:.83rem;margin-top:2px}.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:29px}.metric{border-left:2px solid var(--cyan);padding:5px 0 5px 14px}.metric strong{display:block;font-size:1rem}.metric span{color:var(--muted);font-size:.83rem}.contact-box{display:flex;align-items:center;justify-content:space-between;gap:22px;margin-top:27px;border:1px solid rgba(0,212,255,.28);border-radius:20px;padding:24px;background:linear-gradient(135deg,rgba(0,212,255,.12),rgba(8,31,49,.68))}.contact-box h3{margin:0;font-size:1.35rem}.contact-box p{margin:6px 0 0;color:var(--muted)}.notice-panel{border:1px solid rgba(255,205,112,.35);border-radius:16px;padding:18px;background:rgba(110,69,13,.15);color:#ffe2ac}.notice-panel strong{display:block;color:#ffd47c}.notice-panel p{margin:6px 0 0;color:#efcf99;font-size:.88rem}.footer{border-top:1px solid var(--line);padding:48px 0 30px;background:rgba(3,14,25,.8)}.footer-grid{display:grid;grid-template-columns:1.4fr repeat(3,1fr);gap:24px}.footer p,.footer a{color:var(--muted);font-size:.85rem}.footer a:hover{color:var(--cyan)}.footer h4{margin:0 0 10px;font-size:.84rem}.footer ul{padding:0;margin:0;list-style:none;display:grid;gap:7px}.footer a{text-decoration:none}.bottom{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,.08);margin-top:31px;padding-top:20px;color:var(--muted);font-size:.76rem}.legal{max-width:800px}.legal h2{font-size:1.7rem;margin-top:30px}.legal p,.legal li{color:var(--muted)}.admin-visual{display:grid;place-items:center;min-height:240px;border:1px dashed rgba(255,205,112,.45);border-radius:19px;background:rgba(100,61,11,.13);color:#ffdb91;text-align:center;padding:30px}.empty-list{margin:20px 0 0;padding:0;display:grid;gap:9px;list-style:none}.empty-list li{border-left:2px solid var(--cyan);padding:7px 0 7px 12px;color:var(--muted)}@media(max-width:930px){.hero,.split{grid-template-columns:1fr}.hero{padding-top:35px;gap:28px}.orbit{max-width:650px}.grid{grid-template-columns:repeat(2,1fr)}.footer-grid{grid-template-columns:1fr 1fr}}@media(max-width:620px){.wrap{width:min(100% - 28px,var(--max))}.notice{font-size:.7rem}.nav{min-height:70px}.links a:not(.keep){display:none}h1{font-size:clamp(2.75rem,14vw,4rem)}.section{padding:54px 0}.grid,.metric-grid{grid-template-columns:1fr}.footer-grid{grid-template-columns:1fr}.bottom,.contact-box{align-items:flex-start;flex-direction:column}.node.n1{left:14px}.node.n2{right:13px}.node.n3{right:31px}.l1{left:27%}.links{gap:0}.links a{padding:7px}.hero{min-height:auto}.orbit{min-height:350px}}
'''


def normalize_path(path: str) -> str:
    return "/" if path == "/" else path.rstrip("/") + "/"


def filename_for(path: str) -> Path:
    clean = normalize_path(path).strip("/")
    return OUT / clean / "index.html" if clean else OUT / "index.html"


def nav_html() -> str:
    links = "".join(f'<a href="{href}" class="{"keep" if title == "About" else ""}">{title}</a>' for title, href in NAV)
    return f'''<div class="notice">Independent static release · No APIs, tracking, forms, or credentials are included.</div><header class="wrap nav"><a class="brand" href="/" aria-label="GigitekAI home"><span class="brand-mark">G</span><span>GigitekAI<small>Managed IT · Microsoft 365 · Governed AI</small></span></a><nav class="links" aria-label="Primary navigation">{links}</nav></header>'''


def footer_html() -> str:
    return f'''<footer class="footer"><div class="wrap"><div class="footer-grid"><div><a class="brand" href="/"><span class="brand-mark">G</span><span>GigitekAI<small>AI-first managed services</small></span></a><p>Managed IT, Microsoft 365 architecture, cybersecurity, cloud modernization, and governed AI automation for organizations ready to operate with more clarity and control.</p><p><a href="tel:+16096764483">609-676-4483</a><br><a href="mailto:support@gigitekai.com">support@gigitekai.com</a></p></div><div><h4>Services</h4><ul><li><a href="/services/managed-it/">Managed IT</a></li><li><a href="/services/microsoft-365/">Microsoft 365</a></li><li><a href="/services/ai-automation/">AI Automation</a></li><li><a href="/services/cybersecurity/">Cybersecurity</a></li></ul></div><div><h4>Company</h4><ul><li><a href="/about/">About</a></li><li><a href="/trust-center/">Trust Center</a></li><li><a href="/contact/">Contact</a></li><li><a href="/support/">Support</a></li></ul></div><div><h4>Resources</h4><ul><li><a href="/resources/">Resource Center</a></li><li><a href="/insights/">Insights</a></li><li><a href="/kb/">Knowledge Base</a></li><li><a href="/sitemap.xml">Sitemap</a></li></ul></div></div><div class="bottom"><span>© {CURRENT_YEAR} GigitekAI LLC. All rights reserved.</span><span><a href="/privacy/">Privacy</a> · <a href="/terms-of-service/">Terms</a></span></div></div></footer>'''


def hero_visual() -> str:
    return '''<div class="orbit" aria-label="Illustration of GigitekAI managed services, Microsoft 365, cybersecurity and AI automation working together"><span class="orbit-title">A connected technology operation</span><div class="line l1"></div><div class="line l2"></div><div class="line l3"></div><div class="node n1"><strong>Microsoft 365</strong><span>Identity & collaboration</span></div><div class="node n2"><strong>Cybersecurity</strong><span>Controls & resilience</span></div><div class="node n3"><strong>AI automation</strong><span>Governed workflows</span></div><div class="core">GigitekAI<br>operating<br>model</div><span class="orbit-caption">Built around a secure Microsoft foundation, accountable managed operations, and practical AI workflows.</span></div>'''


def service_cards() -> str:
    cards = []
    for service in SERVICES:
        points = "".join(f"<li>{point}</li>" for point in service["items"])
        cards.append(f'''<article class="card"><div class="card-tag">{service["tag"]}</div><h3>{service["name"]}</h3><p>{service["description"]}</p><ul>{points}</ul><a href="{service["path"]}">Explore capability →</a></article>''')
    return '<div class="grid">' + ''.join(cards) + '</div>'


def page_body(path: str, page: dict) -> str:
    home = page["kind"] == "home"
    hero = f'''<section class="wrap hero"><div><span class="eyebrow">{page["eyebrow"]}</span><h1>{page["headline"].replace("governed AI", "<span class=\"cyan\">governed AI</span>")}</h1><p class="lede">{page["lede"]}</p><div class="actions"><a class="button primary" href="/contact/">Talk with GigitekAI →</a><a class="button secondary" href="/services/">Explore services</a></div><p class="hero-note">Direct contact is intentional: call or email without a third-party form, CRM, or embedded tracker.</p></div>{hero_visual() if home else ''}</section>'''
    if home:
        body = hero + f'''<section class="section alt"><div class="wrap"><div class="kicker">The GigitekAI approach</div><h2>Technology that becomes a business advantage.</h2><p class="intro">GigitekAI brings enterprise architecture discipline to the operational realities of small and midsize organizations. The goal is simple: reduce risk, remove manual friction, and create a technology environment that is easier to run.</p>{service_cards()}</div></section><section class="section"><div class="wrap"><div class="split"><div class="panel"><div class="kicker">How engagement starts</div><h2>See the operating picture before prescribing the tools.</h2><p>Every organization has a different mix of people, systems, risk, and growth pressure. The first conversation identifies the practical changes that will have the greatest operational impact.</p><div class="contact-box"><div><h3>Start a direct conversation.</h3><p>No static-site form to disappear into a queue.</p></div><a class="button primary" href="mailto:support@gigitekai.com?subject=GigitekAI%20technology%20conversation">Email GigitekAI</a></div></div><div class="panel"><div class="kicker">Operating priorities</div><div class="steps"><div class="step"><b>01</b><div><strong>Stabilize</strong><span>Improve visibility, support, backup posture, and daily technology confidence.</span></div></div><div class="step"><b>02</b><div><strong>Secure</strong><span>Strengthen identity, endpoint, email, and recovery controls through a Zero Trust mindset.</span></div></div><div class="step"><b>03</b><div><strong>Modernize</strong><span>Use Microsoft 365, cloud, and automation to make work more consistent and scalable.</span></div></div><div class="step"><b>04</b><div><strong>Automate</strong><span>Apply governed AI workflows to remove repetitive work without losing accountability.</span></div></div></div></div></div></div></section><section class="section alt"><div class="wrap"><div class="kicker">Who we support</div><h2>Built for organizations that need a stronger technology operation.</h2><div class="metric-grid"><div class="metric"><strong>Growing teams</strong><span>Practical systems, responsive support, and a foundation that scales without unnecessary complexity.</span></div><div class="metric"><strong>Regulated work</strong><span>Security and compliance-conscious thinking for organizations managing real operational risk.</span></div><div class="metric"><strong>Transformation moments</strong><span>Microsoft 365 modernization, security improvement, AI adoption, and technology operating-model change.</span></div></div></div></section>'''
        return body
    if page["kind"] == "services":
        return hero + f'''<section class="section alt"><div class="wrap"><div class="kicker">Core capabilities</div><h2>Practical services, designed to work together.</h2>{service_cards()}</div></section><section class="section"><div class="wrap"><div class="split"><div class="panel"><div class="kicker">Not a menu of disconnected tools</div><h2>Architecture and operations should reinforce each other.</h2><p>Technology planning fails when security, support, Microsoft 365, cloud, and automation are managed as unrelated projects. GigitekAI brings them together into a more coherent operating model.</p></div><div class="panel"><div class="kicker">Direct next step</div><h3>Tell us what needs to improve first.</h3><p>Whether the priority is support, Microsoft 365, security, cloud, AI automation, or a combination, start with a direct conversation.</p><div class="actions"><a class="button primary" href="mailto:support@gigitekai.com?subject=GigitekAI%20services%20discussion">Email support</a><a class="button secondary" href="tel:+16096764483">Call 609-676-4483</a></div></div></div></div></section>'''
    if page["kind"] == "detail":
        service = page["service"]
        items = ''.join(f'<li>{item}</li>' for item in service["items"])
        return hero + f'''<section class="section alt"><div class="wrap"><div class="split"><div class="panel"><div class="kicker">What this capability covers</div><h2>{service["name"]}, put into practice.</h2><p>{service["description"]}</p><ul class="empty-list">{items}</ul></div><div class="panel"><div class="kicker">The GigitekAI standard</div><h3>Secure by design. Clear in operation. Built to evolve.</h3><p>Engagement design starts with the current environment, business priorities, risk profile, and the people who must operate the solution after it is delivered.</p><div class="notice-panel"><strong>Static public release</strong><p>Interactive assessments, portal access, live AI chat, and form submission are intentionally unavailable here until their independent, secure service layer is selected and built.</p></div></div></div><div class="contact-box"><div><h3>Discuss {service["name"].lower()}.</h3><p>Use direct email or telephone—there is no third-party form processor in this release.</p></div><a class="button primary" href="mailto:support@gigitekai.com?subject=GigitekAI%20{service["name"].replace(" ", "%20")}">Email GigitekAI</a></div></div></section>'''
    if page["kind"] == "about":
        return hero + '''<section class="section alt"><div class="wrap"><div class="split"><div class="panel"><div class="kicker">What GigitekAI does</div><h2>Help organizations operate with less friction and more control.</h2><p>GigitekAI combines Microsoft 365 architecture, managed IT operations, cybersecurity, cloud modernization, and governed AI automation. The work is designed to make technology easier to run today and more valuable over time.</p></div><div class="panel"><div class="kicker">How we think</div><div class="steps"><div class="step"><b>01</b><div><strong>Business before tools</strong><span>Choose technology based on the operational result, not the trend cycle.</span></div></div><div class="step"><b>02</b><div><strong>Zero Trust mindset</strong><span>Build identity, access, endpoint, and recovery decisions around verification and least privilege.</span></div></div><div class="step"><b>03</b><div><strong>AI with accountability</strong><span>Use automation to remove repetitive work while retaining human oversight and governance.</span></div></div></div></div></div></div></section>'''
    if page["kind"] == "resources":
        return hero + '''<section class="section alt"><div class="wrap"><div class="kicker">Independent publishing foundation</div><h2>Static content now. Secure publishing workflow next.</h2><p class="intro">This release deliberately avoids database, CMS, scheduler, and AI generation dependencies. It provides a stable public destination that can later publish version-controlled content without coupling it to a proprietary hosting platform.</p><div class="grid"><article class="card"><div class="card-tag">Microsoft 365</div><h3>Modern work guidance</h3><p>Architecture, identity, collaboration, and governance topics for business leaders and IT teams.</p><a href="/services/microsoft-365/">Explore Microsoft 365 →</a></article><article class="card"><div class="card-tag">Cybersecurity</div><h3>Risk reduction basics</h3><p>Identity, endpoint, email, backup, and resilience principles for stronger operations.</p><a href="/services/cybersecurity/">Explore cybersecurity →</a></article><article class="card"><div class="card-tag">AI automation</div><h3>Practical adoption</h3><p>Governed workflows and AI readiness for teams seeking meaningful operational improvement.</p><a href="/services/ai-automation/">Explore AI automation →</a></article><article class="card"><div class="card-tag">Managed IT</div><h3>Operational clarity</h3><p>How responsive support, visibility, and accountable ownership reduce technology friction.</p><a href="/services/managed-it/">Explore managed IT →</a></article></div></div></section>'''
    if page["kind"] == "trust":
        return hero + '''<section class="section alt"><div class="wrap"><div class="grid"><article class="card"><div class="card-tag">Security</div><h3>Least privilege</h3><p>Access should be deliberate, necessary, and reviewable—not assumed because a system is convenient.</p></article><article class="card"><div class="card-tag">Resilience</div><h3>Recoverable operations</h3><p>Backup, continuity, and incident readiness are operating capabilities, not checkbox purchases.</p></article><article class="card"><div class="card-tag">AI governance</div><h3>Human accountability</h3><p>AI automation should be scoped, observable, and designed with meaningful approval boundaries.</p></article><article class="card"><div class="card-tag">Privacy</div><h3>Data minimization</h3><p>Use and retain only the data required for the agreed business outcome and security obligations.</p></article></div><div class="notice-panel" style="margin-top:22px"><strong>This static site is intentionally minimal.</strong><p>There are no embedded analytics, live chat, visitor form, session, API request, or customer portal on this public release. Direct links to email and telephone are the only contact mechanisms.</p></div></div></section>'''
    if page["kind"] == "contact":
        return hero + '''<section class="section alt"><div class="wrap"><div class="split"><div class="panel"><div class="kicker">Direct contact</div><h2>Email or call GigitekAI.</h2><p>This is deliberately a no-form, no-tracker release. Use the channel you prefer and a GigitekAI team member can coordinate the right next step.</p><div class="actions"><a class="button primary" href="mailto:support@gigitekai.com?subject=GigitekAI%20inquiry">support@gigitekai.com</a><a class="button secondary" href="tel:+16096764483">609-676-4483</a></div></div><div class="panel"><div class="kicker">Topics we can discuss</div><ul class="empty-list"><li>Managed IT operations and support models</li><li>Microsoft 365, Entra, Teams, and Exchange architecture</li><li>Cybersecurity, resilience, and technology risk</li><li>Cloud modernization and AI automation opportunities</li></ul></div></div></div></section>'''
    if page["kind"] == "legal":
        return hero + '''<section class="section alt"><div class="wrap legal"><h2>Scope of this public site</h2><p>This independent static site is designed to provide general information about GigitekAI. It has no user accounts, database, visitor form, embedded analytics, API calls, chat service, or credential-based feature.</p><h2>Direct communication</h2><p>When you select an email or telephone link, your own device or application handles that communication. Any later business communication is subject to the privacy, security, and contractual terms agreed by the relevant parties.</p><h2>Services</h2><p>Descriptions of capabilities do not create a service commitment, statement of work, or warranty. Actual scope, support commitments, service levels, pricing, and security responsibilities are defined only in signed agreements.</p></div></section>'''
    if page["kind"] == "admin":
        return hero + '''<section class="section alt"><div class="wrap"><div class="admin-visual"><div><div class="kicker" style="color:#ffd47c">Protected functionality excluded</div><h2 style="max-width:620px">The current static site does not include administration, client accounts, helpdesk, Aria, or integrations.</h2><p style="max-width:570px;color:#efcf99">This prevents a misleading or insecure public copy of protected features. Reintroduce these capabilities only after an independent backend, Entra authentication, data store, and secret management model are deployed.</p><a class="button secondary" href="/">Return to public site</a></div></div></div></section>'''
    return hero


def document(path: str, page: dict) -> str:
    canonical = "https://gigitekai.com" + ("" if path == "/" else normalize_path(path))
    return dedent(f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{page["description"]}">
  <link rel="canonical" href="{canonical}">
  <meta name="robots" content="index,follow">
  <meta name="theme-color" content="#07111f">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="GigitekAI">
  <meta property="og:title" content="{page["title"]}">
  <meta property="og:description" content="{page["description"]}">
  <title>{page["title"]}</title>
  <style>{CSS}</style>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="shell">{nav_html()}<main id="main">{page_body(path, page)}</main>{footer_html()}</div>
</body>
</html>
''')


def write_text(relative: str, text: str) -> None:
    file = OUT / relative
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(text.strip() + "\n", encoding="utf-8")


def build() -> None:
    if OUT.exists():
        rmtree(OUT)
    OUT.mkdir(parents=True)
    for path, page in PAGES.items():
        target = filename_for(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(document(path, page), encoding="utf-8")

    write_text("robots.txt", """User-agent: *
Allow: /
Sitemap: https://gigitekai.com/sitemap.xml""")
    urls = "\n".join(f"  <url><loc>https://gigitekai.com{'' if path == '/' else normalize_path(path)}</loc></url>" for path in PAGES)
    write_text("sitemap.xml", f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>''')
    write_text("_headers", """/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; upgrade-insecure-requests

/admin/*
  X-Robots-Tag: noindex, nofollow
""")
    write_text("_redirects", """/about-us  /about/  301
/blog       /insights/  301
/privacy-policy  /privacy/  301
/helpdesk   /support/  302
""")
    write_text("404.html", document("/not-found", {
        "title": "Page Not Found | GigitekAI",
        "description": "The requested GigitekAI page was not found.",
        "eyebrow": "404",
        "headline": "That page is not part of this public release.",
        "lede": "Return to GigitekAI’s independent public site or contact us directly.",
        "kind": "contact",
    }))
    print(f"Built {len(PAGES)} routes in {OUT}")


if __name__ == "__main__":
    build()
