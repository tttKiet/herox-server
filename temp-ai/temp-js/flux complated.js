class RandomScroller {
  constructor({
    minScroll = 200,
    maxScroll = 1200,
    minPause = 500,
    maxPause = 2500,
    scrollStep = 100,
  } = {}) {
    this.minScroll = minScroll; // px
    this.maxScroll = maxScroll; // px
    this.minPause = minPause; // ms
    this.maxPause = maxPause; // ms
    this.scrollStep = scrollStep; // px mỗi lần scroll nhỏ
    this.isScrolling = false;
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async scrollOnce() {
    // Chọn kiểu scroll: 0 = ngắn, 1 = dài, 2 = lên, 3 = dừng lâu
    const mode = this.getRandomInt(0, 3);
    let distance = 0;
    let direction = 1; // 1: xuống, -1: lên
    let pause = this.getRandomInt(this.minPause, this.maxPause);

    switch (mode) {
      case 0: // lướt ngắn
        distance = this.getRandomInt(this.minScroll, this.minScroll + 200);
        direction = 1;
        break;
      case 1: // lướt dài
        distance = this.getRandomInt(this.maxScroll - 200, this.maxScroll);
        direction = 1;
        break;
      case 2: // lướt lên
        distance = this.getRandomInt(this.minScroll, this.maxScroll / 2);
        direction = -1;
        break;
      case 3: // dừng lâu
        distance = 0;
        pause = this.getRandomInt(this.maxPause, this.maxPause + 2000);
        break;
    }

    if (distance !== 0) {
      let scrolled = 0;
      while (scrolled < distance) {
        const step = Math.min(this.scrollStep, distance - scrolled);
        window.scrollBy({ top: step * direction, behavior: "smooth" });
        scrolled += step;
        await this.sleep(this.getRandomInt(30, 120)); // delay nhỏ giữa các bước
      }
    }
    await this.sleep(pause);
  }

  async start({ repeat = 30 } = {}) {
    this.isScrolling = true;
    for (let i = 0; i < repeat && this.isScrolling; i++) {
      await this.scrollOnce();
    }
    this.isScrolling = false;
  }

  stop() {
    this.isScrolling = false;
  }
}

// Ví dụ sử dụng trên X:
const scroller = new RandomScroller();
scroller.start({ repeat: 50 });
// Để dừng: scroller.stop();
