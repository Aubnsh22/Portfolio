import { Component, HostListener, ViewChild, ElementRef, AfterViewInit, OnInit, QueryList, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'portfolio-app';

  @ViewChild('nameWrapper') nameWrapper!: ElementRef;
  @ViewChild('portfolioImg') portfolioImg!: ElementRef;
  @ViewChild('portfolioText') portfolioText!: ElementRef;
  @ViewChild('zoomContainer') zoomContainer!: ElementRef;
  @ViewChild('aboutMeContainer') aboutMeContainer!: ElementRef;
  @ViewChild('scrollContent') scrollContent!: ElementRef;
  @ViewChild('storySection') storySection!: ElementRef;
  @ViewChild('heroCanvas') heroCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChildren('storyCard') storyCards!: QueryList<ElementRef>;

  wordsVisible = [false, false, false, false];
  showScrollMessage = false;
  backgroundColor = '#000000';
  heroBgOpacity = 1;
  showStaticTitle = false;
  private textShown = false;
  private lastScrollProgress = 0;

  private ctx!: CanvasRenderingContext2D;
  private particles: any[] = [];
  private animationId!: number;

  currentIndex = 2; // Start with center project
  private totalProjects = 5;
  private isDragging = false;
  private startX = 0;
  private cardWidth = 345; // 320px width + 25px gap

  // Contact Feedback States
  showEmailTooltip = false;
  showPhoneTooltip = false;

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.updateScrollEffect();
    this.initParticles();
    this.animateParticles();
  }

  @HostListener('window:resize')
  onResize() {
    this.initParticles();
  }

  private initParticles() {
    if (!this.heroCanvas) return;
    const canvas = this.heroCanvas.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.particles = [];
    const particleCount = Math.floor(window.innerWidth / 15);

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  private animateParticles() {
    if (!this.ctx) return;
    const canvas = this.heroCanvas.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mouseXPos = parseFloat(document.documentElement.style.getPropertyValue('--mouse-x')) || 50;
    const mouseYPos = parseFloat(document.documentElement.style.getPropertyValue('--mouse-y')) || 50;

    const mouseX = (mouseXPos / 100) * canvas.width;
    const mouseY = (mouseYPos / 100) * canvas.height;

    // "Star Burst" effect: Spawn a temporary star sometimes when moving
    if (Math.random() > 0.6) {
      this.particles.push({
        x: mouseX + (Math.random() - 0.5) * 20,
        y: mouseY + (Math.random() - 0.5) * 20,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        opacity: 0.8,
        isTemp: true,
        life: 1.0 // Lifespan from 1.0 to 0
      });
    }

    // Keep particle count in check
    if (this.particles.length > 800) {
      this.particles.splice(0, this.particles.length - 800);
    }

    this.particles.forEach((p, index) => {
      p.x += p.speedX;
      p.y += p.speedY;

      // Temporary stars fade out and move differently
      if (p.isTemp) {
        p.life -= 0.01;
        p.opacity = p.life * 0.8;
        if (p.life <= 0) {
          // Splice is expensive in forEach, better to filter later but for small count it's ok
          this.particles.splice(index, 1);
          return;
        }
      } else {
        // Regular particles wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }

      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 200; // Increased interaction range

      let currentOpacity = p.opacity;
      if (distance < maxDist) {
        // Stronger intensity near mouse
        const intensity = (1 - distance / maxDist);
        currentOpacity = Math.min(1, p.opacity + (intensity * 0.8));

        // Stronger "pull" or "cluster" effect
        p.x += dx * 0.02 * intensity;
        p.y += dy * 0.02 * intensity;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.isTemp ? p.size * p.life : p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
      this.ctx.fill();
    });

    this.animationId = requestAnimationFrame(() => this.animateParticles());
  }

  @HostListener('window:scroll')
  onScroll() {
    this.updateScrollEffect();
  }

  @HostListener('window:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (this.isMouseInCarousel(event)) {
      this.isDragging = true;
      this.startX = this.getPositionX(event);
    }
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const x = (event.clientX / window.innerWidth - 0.5) * 20;
    const y = (event.clientY / window.innerHeight - 0.5) * 20;
    document.documentElement.style.setProperty('--mouse-x', `${50 + x}%`);
    document.documentElement.style.setProperty('--mouse-y', `${50 + y}%`);

    if (this.isDragging) {
      const deltaX = this.getPositionX(event) - this.startX;
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) this.prev();
        else this.next();
        this.isDragging = false;
      }
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') this.prev();
    if (event.key === 'ArrowRight') this.next();
  }

  next() {
    if (this.currentIndex < this.totalProjects - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.totalProjects - 1;
    }
  }

  onDragStart(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.startX = this.getPositionX(event);
    const track = document.querySelector('.carousel-track') as HTMLElement;
    if (track) track.style.transition = 'none';
  }

  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;
  }

  onDragEnd() {
    this.isDragging = false;
    const track = document.querySelector('.carousel-track') as HTMLElement;
    if (track) track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  private getPositionX(event: MouseEvent | TouchEvent) {
    return event instanceof MouseEvent ? event.pageX : event.touches[0].pageX;
  }

  private isMouseInCarousel(event: MouseEvent): boolean {
    const carousel = document.querySelector('.portfolio-carousel-wrapper');
    if (!carousel) return false;
    const rect = carousel.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
  }

  getCardTransform(index: number) {
    const diff = index - this.currentIndex;
    const translateX = diff * this.cardWidth;
    const scale = index === this.currentIndex ? 1.3 :
      Math.abs(diff) === 1 ? 1.0 :
        Math.abs(diff) === 2 ? 0.85 : 0.7;

    return `translateX(${translateX}px) scale(${scale})`;
  }

  getCardOpacity(index: number) {
    const diff = Math.abs(index - this.currentIndex);
    if (diff === 0) return 1;
    if (diff === 1) return 0.7;
    if (diff === 2) return 0.4;
    return 0;
  }

  getCardBlur(index: number) {
    const diff = Math.abs(index - this.currentIndex);
    if (diff === 0) return 'blur(0px)';
    if (diff === 1) return 'blur(1px)';
    if (diff === 2) return 'blur(3px)';
    return 'blur(8px)';
  }

  private updateScrollEffect() {
    const scrollY = window.scrollY;
    const maxScroll = 600;
    const progress = Math.min(scrollY / maxScroll, 1);

    const blurAmount = progress * 20;
    const translateY = -(progress * 150);

    if (this.nameWrapper) {
      const nameEl = this.nameWrapper.nativeElement as HTMLElement;
      nameEl.style.filter = `blur(${blurAmount}px)`;
      nameEl.style.transform = `translateY(${translateY}px)`;

      if (scrollY > 1500) {
        const upProgress = Math.min((scrollY - 1500) / 300, 1);
        const upTranslate = -(upProgress * 300);
        nameEl.style.transform = `translateY(${translateY + upTranslate}px)`;
        nameEl.style.opacity = (1 - upProgress).toString();
      } else {
        nameEl.style.opacity = '1';
      }
    }

    if (this.portfolioImg) {
      const imgEl = this.portfolioImg.nativeElement as HTMLElement;
      const startLeft = -300;
      const endLeft = window.innerWidth / 2 - 100;
      const currentLeft = startLeft + (progress * (endLeft - startLeft));

      imgEl.style.left = `${currentLeft}px`;
      imgEl.style.opacity = progress.toString();

      if (scrollY > 1500) {
        const upProgress = Math.min((scrollY - 1500) / 300, 1);
        const upTranslate = -(upProgress * 300);
        imgEl.style.transform = `translateY(calc(-50% + ${upTranslate}px))`;
      }
    }

    const wordThresholds = [1000, 1100, 1200, 1300];
    wordThresholds.forEach((threshold, index) => {
      this.wordsVisible[index] = scrollY >= threshold;
    });

    this.textShown = this.wordsVisible.some(v => v);

    if (this.portfolioText && scrollY > 1500) {
      const upProgress = Math.min((scrollY - 1500) / 300, 1);
      const upTranslate = -(upProgress * 300);
      const textEl = this.portfolioText.nativeElement as HTMLElement;
      textEl.style.transform = `translateX(-50%) translateY(${upTranslate}px)`;
    }

    this.showScrollMessage = scrollY >= 1800;

    if (this.zoomContainer) {
      const zoomEl = this.zoomContainer.nativeElement as HTMLElement;
      if (scrollY > 2000) {
        const zoomProgress = Math.min((scrollY - 2000) / 1500, 1);
        const scale = 1 - (zoomProgress * 0.85);
        const borderRadius = zoomProgress * 30;

        zoomEl.style.transform = `scale(${scale})`;
        zoomEl.style.borderRadius = `${borderRadius}px`;
        zoomEl.style.background = '#000000';

        if (zoomProgress > 0.3) {
          const shadowIntensity = (zoomProgress - 0.3) * 60;
          zoomEl.style.boxShadow = `0 ${shadowIntensity}px ${shadowIntensity * 2}px rgba(0, 0, 0, 0.3)`;
        }

        const colorValue = Math.floor(zoomProgress * 255);
        this.backgroundColor = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
        this.heroBgOpacity = 1 - zoomProgress;
      } else {
        zoomEl.style.transform = 'scale(1)';
        zoomEl.style.borderRadius = '0px';
        zoomEl.style.boxShadow = 'none';
        zoomEl.style.background = 'transparent';
        this.backgroundColor = '#000000';
        this.heroBgOpacity = 1;
      }

      if (scrollY > 3500) {
        const finalScale = 0.15;
        if (scrollY <= 4000) {
          const phase1Progress = Math.min((scrollY - 3500) / 500, 1);
          const slideRight = phase1Progress * 2500;
          zoomEl.style.transform = `scale(${finalScale}) translateX(${slideRight}px)`;
          zoomEl.style.opacity = (1 - phase1Progress).toString();
        } else {
          zoomEl.style.opacity = '0';
          zoomEl.style.transform = `scale(${finalScale}) translateX(2500px)`;
        }
      } else if (scrollY > 2000) {
        zoomEl.style.opacity = '1';
      }
    }

    if (this.aboutMeContainer) {
      const aboutEl = this.aboutMeContainer.nativeElement as HTMLElement;
      if (scrollY > 3500) {
        if (scrollY <= 4000) {
          const phase1Progress = Math.min((scrollY - 3500) / 500, 1);
          const scale = 0.3 + (phase1Progress * 0.7);
          const blur = (1 - phase1Progress) * 30;
          aboutEl.style.transform = `translate(-50%, -50%) scale(${scale})`;
          aboutEl.style.opacity = phase1Progress.toString();
          aboutEl.style.filter = `blur(${blur}px)`;
        } else {
          const headerTop = 150;
          const endY = headerTop - (window.innerHeight / 2);
          let currentY = 0;
          let currentScale = 1.0;

          if (scrollY <= 4300) {
            currentScale = 1.0;
            currentY = 0;
          } else if (scrollY <= 4800) {
            const phase3Progress = (scrollY - 4300) / 500;
            currentScale = 1.0 - (phase3Progress * 0.7);
            currentY = phase3Progress * endY;
          } else {
            currentScale = 0.3;
            currentY = endY - (scrollY - 4800);
          }

          aboutEl.style.transform = `translate(-50%, calc(-50% + ${currentY}px)) scale(${currentScale})`;
          aboutEl.style.opacity = '1';
          aboutEl.style.filter = 'blur(0px)';
        }
      } else {
        aboutEl.style.transform = 'translate(-50%, -50%) scale(0.3)';
        aboutEl.style.opacity = '0';
        aboutEl.style.filter = 'blur(30px)';
      }
    }

    if (this.scrollContent) {
      const scrollContentEl = this.scrollContent.nativeElement as HTMLElement;
      scrollContentEl.style.zIndex = scrollY > 4000 ? '10' : '1';

      if (this.storyCards) {
        this.storyCards.forEach((item: ElementRef, index: number) => {
          const card = item.nativeElement as HTMLElement;
          const rect = card.getBoundingClientRect();
          const cardTop = rect.top;
          const triggerPoint = window.innerHeight * 0.85;

          if (cardTop < triggerPoint) {
            const cardProgress = Math.min((triggerPoint - cardTop) / 300, 1);
            const direction = index % 2 === 0 ? -1 : 1;
            const startX = direction * 100;
            const currentX = startX * (1 - cardProgress);

            card.style.opacity = cardProgress.toString();
            card.style.transform = `translateX(${currentX}px)`;
          } else {
            const direction = index % 2 === 0 ? -1 : 1;
            card.style.opacity = '0';
            card.style.transform = `translateX(${direction * 100}px)`;
          }
        });
      }
    }

    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineLine = document.querySelector('.timeline-line') as HTMLElement;

    if (timelineLine) {
      const rect = timelineLine.getBoundingClientRect();
      const triggerPoint = window.innerHeight * 0.9;
      if (rect.top < triggerPoint) {
        const lineProgress = Math.min((triggerPoint - rect.top) / 800, 1);
        timelineLine.style.height = `${lineProgress * 100}%`;
      }
    }

    timelineItems.forEach((item: Element, index: number) => {
      const el = item as HTMLElement;
      const rect = el.getBoundingClientRect();
      const triggerPoint = window.innerHeight * 0.85;

      if (rect.top < triggerPoint) {
        const cardProgress = Math.min((triggerPoint - rect.top) / 400, 1);
        const isLeft = index % 2 === 0;
        const startX = isLeft ? -50 : 50;
        const currentX = startX * (1 - cardProgress);

        el.style.opacity = cardProgress.toString();
        el.style.transform = `translateX(${currentX}px)`;
      } else {
        const isLeft = index % 2 === 0;
        el.style.opacity = '0';
        el.style.transform = `translateX(${isLeft ? -50 : 50}px)`;
      }
    });

    this.lastScrollProgress = progress;
  }

  showPortfolioText() {
    this.wordsVisible = [true, true, true, true];
    this.textShown = true;
  }

  hidePortfolioText() {
    this.textShown = false;
    this.wordsVisible = [false, false, false, false];
  }

  copyToClipboard(text: string, type: 'email' | 'phone') {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'email') {
        this.showEmailTooltip = true;
        setTimeout(() => this.showEmailTooltip = false, 2000);
      } else {
        this.showPhoneTooltip = true;
        setTimeout(() => this.showPhoneTooltip = false, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
}
