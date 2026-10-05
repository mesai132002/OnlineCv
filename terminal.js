document.addEventListener("DOMContentLoaded", () => {
  const screen = document.getElementById("screen");
  const history = document.getElementById("history");
  const form = document.getElementById("shellForm");
  const input = document.getElementById("shellInput");
  const quick = document.querySelector(".quick");
  const skipButton = document.getElementById("skipButton");
  const motd = document.querySelector(".motd");
  const blocks = Array.from(screen.querySelectorAll(":scope > .block"));

  const PROMPT_HTML =
    'angel@veracruz<span class="ps1-sep">:</span><span class="ps1-path">~/cv</span>$';

  /* ---------- static bits: year, age, clock, last login ---------- */

  const now = new Date();
  const yearNode = document.getElementById("year");
  if (yearNode) yearNode.textContent = now.getFullYear();

  const birth = new Date(2002, 8, 13);
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  document.querySelectorAll("[data-age]").forEach((node) => {
    node.textContent = age;
  });

  const lastLogin = document.getElementById("lastLogin");
  if (lastLogin) {
    lastLogin.textContent = now.toDateString().slice(0, 10);
  }

  const clock = document.getElementById("clock");
  const tick = () => {
    if (clock) {
      clock.textContent = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };
  tick();
  setInterval(tick, 15000);

  document.getElementById("printButton")?.addEventListener("click", () => window.print());

  /* ---------- boot sequence ---------- */

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let booting = !reducedMotion;

  const commandTexts = blocks.map((block) => block.querySelector(".cmd").textContent);

  const revealAll = () => {
    booting = false;
    blocks.forEach((block, i) => {
      block.classList.remove("pending");
      const cmd = block.querySelector(".cmd");
      cmd.textContent = commandTexts[i];
      cmd.classList.remove("typing");
      block.querySelector(".output").classList.remove("hidden");
    });
    form.classList.remove("pending");
    quick.classList.remove("pending");
    form.classList.add("idle");
    skipButton.hidden = true;
  };

  const boot = async () => {
    blocks.forEach((block) => {
      block.classList.add("pending");
      block.querySelector(".cmd").textContent = "";
      block.querySelector(".output").classList.add("hidden");
    });
    form.classList.add("pending");
    quick.classList.add("pending");

    await wait(450);
    for (let i = 0; i < blocks.length; i += 1) {
      if (!booting) return;
      const block = blocks[i];
      const cmd = block.querySelector(".cmd");
      const output = block.querySelector(".output");
      block.classList.remove("pending");
      cmd.classList.add("typing");

      for (const char of commandTexts[i]) {
        if (!booting) return;
        cmd.textContent += char;
        await wait(26 + Math.random() * 40);
      }
      await wait(220);
      if (!booting) return;
      cmd.classList.remove("typing");
      output.classList.remove("hidden");
      output.classList.add("reveal");
      await wait(520);
    }
    revealAll();
  };

  if (booting) {
    boot();
  } else {
    revealAll();
  }

  skipButton.addEventListener("click", (event) => {
    event.stopPropagation();
    revealAll();
  });

  document.addEventListener("keydown", (event) => {
    if (booting && !event.ctrlKey && !event.metaKey) revealAll();
  });

  screen.addEventListener("click", (event) => {
    if (booting) {
      revealAll();
      return;
    }
    const interactive = event.target.closest("a, button, input");
    const selecting = window.getSelection()?.toString();
    if (!interactive && !selecting) input.focus({ preventScroll: true });
  });

  /* ---------- interactive shell ---------- */

  const findBlock = (name) => blocks.find((block) => block.dataset.cmd === name);

  const aliases = {
    profile: "contact",
    phone: "contact",
    email: "contact",
    about: "summary",
    work: "experience",
    "git log": "experience",
    jobs: "experience",
    school: "education",
    stack: "skills",
    locale: "languages",
    soft: "soft-skills",
  };

  const helpEntries = [
    ["whoami", "name and role"],
    ["contact", "phone, email, LinkedIn, birthdate"],
    ["summary", "professional summary"],
    ["experience", "work history (git log)"],
    ["education", "degree and institution"],
    ["skills", "technical skills tree"],
    ["languages", "spoken languages"],
    ["soft-skills", "professional attributes"],
    ["print", "print / save as PDF"],
    ["classic", "open the classic CV layout"],
    ["clear", "clear the screen"],
  ];

  const makeEntry = (typed) => {
    const entry = document.createElement("section");
    entry.className = "block";
    const line = document.createElement("div");
    line.className = "prompt-line";
    line.innerHTML = `<span class="ps1">${PROMPT_HTML}</span>`;
    const cmd = document.createElement("span");
    cmd.className = "cmd";
    cmd.textContent = typed;
    line.appendChild(cmd);
    entry.appendChild(line);
    return entry;
  };

  const makeOutput = (content) => {
    const output = document.createElement("div");
    output.className = "output reveal";
    if (typeof content === "string") {
      const p = document.createElement("p");
      p.innerHTML = content;
      output.appendChild(p);
    } else {
      output.appendChild(content);
    }
    return output;
  };

  const helpOutput = () => {
    const dl = document.createElement("dl");
    dl.className = "help-grid";
    helpEntries.forEach(([name, description]) => {
      const dt = document.createElement("dt");
      dt.textContent = name;
      const dd = document.createElement("dd");
      dd.textContent = description;
      dl.append(dt, dd);
    });
    return makeOutput(dl);
  };

  const clearScreen = () => {
    history.innerHTML = "";
    blocks.forEach((block) => block.classList.add("pending"));
    motd.hidden = true;
  };

  const run = (raw) => {
    const typed = raw.trim();
    if (!typed) return;
    const name = typed.toLowerCase();

    if (name === "clear" || name === "cls") {
      clearScreen();
      return;
    }

    const entry = makeEntry(typed);
    const key = aliases[name] || name;
    const source = findBlock(key);

    if (name === "help" || name === "ls" || name === "?") {
      entry.appendChild(helpOutput());
    } else if (source) {
      const output = source.querySelector(".output").cloneNode(true);
      output.classList.remove("hidden", "reveal");
      void output.offsetWidth;
      output.classList.add("reveal");
      entry.appendChild(output);
    } else if (name === "classic" || name === "cd ..") {
      entry.appendChild(makeOutput('<span class="dim">opening index.html…</span>'));
      setTimeout(() => {
        window.location.href = "index.html";
      }, 350);
    } else if (name === "print") {
      entry.appendChild(makeOutput('<span class="dim">sending CV to printer…</span>'));
      setTimeout(() => window.print(), 250);
    } else if (name === "sudo hire-me" || name === "hire-me") {
      entry.appendChild(
        makeOutput(
          '<span class="ok">✔ permission granted.</span> Reach me at <a class="s" href="mailto:mesai132002@gmail.com">mesai132002@gmail.com</a> or <a class="s" href="tel:+522294588889">+52 229 458 8889</a>.'
        )
      );
    } else {
      const output = makeOutput("");
      output.firstChild.className = "error";
      output.firstChild.textContent = `bash: ${typed}: command not found. Type 'help' for available commands.`;
      entry.appendChild(output);
    }

    history.appendChild(entry);
    form.scrollIntoView({ block: "end", behavior: reducedMotion ? "auto" : "smooth" });
  };

  const past = [];
  let pastIndex = 0;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value;
    if (value.trim()) {
      past.push(value);
      pastIndex = past.length;
    }
    input.value = "";
    run(value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" && pastIndex > 0) {
      pastIndex -= 1;
      input.value = past[pastIndex];
      event.preventDefault();
    } else if (event.key === "ArrowDown") {
      pastIndex = Math.min(past.length, pastIndex + 1);
      input.value = past[pastIndex] || "";
      event.preventDefault();
    }
  });

  input.addEventListener("focus", () => form.classList.remove("idle"));
  input.addEventListener("blur", () => {
    if (!input.value) form.classList.add("idle");
  });

  quick.addEventListener("click", (event) => {
    const button = event.target.closest("[data-run]");
    if (button) run(button.dataset.run);
  });
});
