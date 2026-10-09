import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getLandingPage(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0b1020" />
  <title>Cloud Campus API</title>
  <link rel="icon" type="image/png" href="/cloud-campus-logo.png?v=3" />
  <link rel="shortcut icon" href="/cloud-campus-logo.png?v=3" />

  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0b1020;
      color: #e8edf8;
      display: flex;
      flex-direction: column;
    }

    a { text-decoration: none; color: inherit; }

    nav {
      min-height: 76px;
      padding: 0 8%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid #222b40;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 700;
    }

    .logo-box {
      width: 44px;
      height: 44px;
      padding: 3px;
      border-radius: 12px;
      background: transparent;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .status {
      color: #86efac;
      font-size: 12px;
      border: 1px solid #24583e;
      background: #10291f;
      padding: 8px 12px;
      border-radius: 30px;
      white-space: nowrap;
    }

    main {
      width: min(1080px, 88%);
      margin: auto;
      padding: 76px 0;
    }

    .eyebrow {
      color: #93a4ff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    h1 {
      max-width: 760px;
      margin: 20px 0;
      font-size: clamp(42px, 6vw, 68px);
      line-height: 1.08;
      letter-spacing: -2px;
    }

    h1 span { color: #8b9aff; }

    .intro {
      max-width: 650px;
      color: #a4b0c5;
      font-size: 18px;
      line-height: 1.8;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 36px 0 56px;
    }

    .button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      min-width: 245px;
      padding: 17px 20px;
      border-radius: 12px;
      font-weight: 650;
      transition: transform .2s;
    }

    .button:hover { transform: translateY(-3px); }

    .primary {
      background: linear-gradient(110deg, #6366f1, #4f83f1);
      color: white;
    }

    .secondary {
      background: #141c2e;
      border: 1px solid #35415b;
    }

    .button small {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      font-weight: 400;
      opacity: .78;
    }

    h2 {
      font-size: 20px;
      margin-bottom: 20px;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }

    .card {
      padding: 24px;
      border: 1px solid #263149;
      background: linear-gradient(145deg, #141c2e, #101728);
      border-radius: 16px;
    }

    .icon {
      width: 28px;
      height: 28px;
      margin-bottom: 18px;
      color: #8b9aff;
    }

    .icon svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .card h3 {
      font-size: 16px;
      margin: 0 0 10px;
    }

    .card p {
      color: #9aa8bf;
      font-size: 14px;
      line-height: 1.7;
      margin: 0;
    }

    .endpoint {
      margin-top: 28px;
      padding: 22px 24px;
      border: 1px solid #263149;
      background: #101728;
      border-radius: 14px;
    }

    .endpoint p {
      color: #9aa8bf;
      font-size: 13px;
      margin: 0 0 12px;
    }

    code {
      color: #a5b4fc;
      overflow-wrap: anywhere;
      font-size: 14px;
    }

    footer {
      margin-top: auto;
      padding: 24px 8%;
      border-top: 1px solid #222b40;
      color: #7f8ba3;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    footer a { color: #a5b4fc; }

    @media (max-width: 650px) {
      nav { padding: 0 6%; }
      main { padding: 52px 0; }
      .features { grid-template-columns: 1fr; }
      .button { width: 100%; }
      h1 { letter-spacing: -1px; }
    }
  </style>
</head>

<body>
  <nav>
    <a class="brand" href="/">
      <span class="logo-box">
        <img class="logo" src="/cloud-campus-logo.png" alt="Cloud Campus logo" />
      </span>
      <span>Cloud Campus API</span>
    </a>
    <span class="status">● API ONLINE</span>
  </nav>

  <main>
    <div class="eyebrow">Cloud Campus · Developer Portal</div>

    <h1>One API.<br /><span>Your entire campus.</span></h1>

    <p class="intro">
      A cloud-based campus management platform providing REST API
      endpoints for courses, students, learning resources and reports.
      Explore the documentation or open the application to get started.
    </p>

    <div class="actions">
      <a class="button primary"
         href="https://app.cloudcampus.cloud"
         target="_blank" rel="noopener noreferrer">
        <span>
          Open Frontend App
          <small>Access Cloud Campus</small>
        </span>
        <span>↗</span>
      </a>

      <a class="button secondary"
         href="https://api.cloudcampus.cloud/api/docs"
         target="_blank" rel="noopener noreferrer">
        <span>
          API Documentation
          <small>Explore endpoints with Swagger</small>
        </span>
        <span>↗</span>
      </a>
    </div>

    <h2>Platform capabilities</h2>

    <section class="features">
      <article class="card">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>
        </div>
        <h3>Course Management</h3>
        <p>Access course information and manage student enrolments.</p>
      </article>

      <article class="card">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        </div>
        <h3>Learning Resources</h3>
        <p>Upload, organise and access shared learning materials.</p>
      </article>

      <article class="card">
        <div class="icon">
          <svg viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
        </div>
        <h3>Reports &amp; Insights</h3>
        <p>Retrieve campus information and activity reports.</p>
      </article>
    </section>

    <section class="endpoint">
      <p>API BASE URL</p>
      <code>https://api.cloudcampus.cloud</code>
    </section>
  </main>

  <footer>
    <span>© Cloud Campus · REST API · Version 1.0</span>
    <a href="https://api.cloudcampus.cloud/api/docs">Swagger Docs ↗</a>
  </footer>
</body>
</html>`;
  }
}
