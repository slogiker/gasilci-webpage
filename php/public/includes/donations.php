<section id="donacije" class="section donations-section">
    <div class="container" style="max-width: 800px; margin: 0 auto; text-align: center;">
        <span class="section-label">PODPORA</span>
        <h2>Podprite naše delo</h2>

        <!-- Mode 1: Nameni del dohodnine -->
        <div class="donation-mode active" id="mode-dohodnina">
            <p class="donation-desc" style="margin-bottom: 2rem;">
                Z namenitijo dela dohodnine podpreš PGD Majšperk Breg brez kakršnihkoli 
                stroškov za vas. Država nameni del vašega že plačanega davka društvu.
            </p>
            <div class="cnvos-placeholder todo" title="TODO: vstaviti CNVOS embed kodo" style="background: var(--bg-subtle); padding: 2rem; border-radius: 8px; margin-bottom: 2rem; border: 1px dashed var(--bg-border);">
                <div class="cnvos-inner">
                    <span class="todo-label" style="color: var(--yellow); font-weight: bold; display: block; margin-bottom: 0.5rem;">⚙ CNVOS embed — vstaviti kodo</span>
                    <p style="margin: 0; color: var(--text-tertiary);">Tu bo vgrajen uradni obrazec za namenitev dela dohodnine.</p>
                </div>
            </div>
            <button class="btn btn-outline toggle-donation-mode" data-target="mode-direct">
                Raje doniram direktno &rarr;
            </button>
        </div>

        <!-- Mode 2: Direktna donacija -->
        <div class="donation-mode" id="mode-direct" style="display:none">
            <p class="donation-desc" style="margin-bottom: 2rem;">Izberite znesek ali vpišite poljubni znesek donacije.</p>
            <div class="amount-presets" style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1.5rem;">
                <button class="btn btn-outline amount-btn active" data-amount="5">5 €</button>
                <button class="btn btn-outline amount-btn" data-amount="10">10 €</button>
                <button class="btn btn-outline amount-btn custom-trigger">Po meri</button>
            </div>
            <div class="custom-amount" id="custom-amount" style="display:none; margin-bottom: 1.5rem;">
                <input type="number" min="1" placeholder="Vnesite znesek v €" class="amount-input" style="padding: 0.75rem; border-radius: 6px; border: 1px solid var(--bg-border); background: var(--bg-subtle); color: var(--text-primary); text-align: center; width: 200px;" />
            </div>
            <!-- Bank transfer info -->
            <div class="bank-info todo" title="TODO: preveriti IBAN" style="background: var(--bg-subtle); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; text-align: left; display: inline-block; text-align: center;">
                <span style="display: block; font-weight: bold; color: var(--text-primary); margin-bottom: 0.5rem;">Nakazilo na: SI56 XXXX XXXX XXXX XXX</span>
                <span style="display: block; color: var(--text-secondary);">Namen: Donacija PGD Majšperk Breg</span>
            </div>
            <div>
                <button class="btn btn-outline toggle-donation-mode" data-target="mode-dohodnina">
                    &larr; Nazaj na dohodnino
                </button>
            </div>
        </div>

    </div>
</section>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.toggle-donation-mode').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.donation-mode').forEach(m => m.style.display = 'none');
                document.getElementById(btn.dataset.target).style.display = 'block';
            });
        });

        document.querySelectorAll('.amount-btn:not(.custom-trigger)').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.amount-btn').forEach(b => {
                    b.classList.remove('active');
                    b.classList.replace('btn-red', 'btn-outline');
                });
                this.classList.add('active');
                this.classList.replace('btn-outline', 'btn-red');
                const customAmount = document.getElementById('custom-amount');
                if(customAmount) customAmount.style.display = 'none';
            });
        });

        const customTrigger = document.querySelector('.custom-trigger');
        if(customTrigger) {
            customTrigger.addEventListener('click', function() {
                document.querySelectorAll('.amount-btn').forEach(b => {
                    b.classList.remove('active');
                    b.classList.replace('btn-red', 'btn-outline');
                });
                this.classList.add('active');
                this.classList.replace('btn-outline', 'btn-red');
                const customAmount = document.getElementById('custom-amount');
                if(customAmount) customAmount.style.display = 'block';
            });
        }
    });
</script>