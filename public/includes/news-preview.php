<section id="news" class="section">
    <div class="container">
        <div class="flex justify-between align-center" style="margin-bottom: 2rem;">
            <div>
                <span class="section-label">NOVICE</span>
                <h2>Zadnje novice</h2>
            </div>
            <a href="novice.php" class="news-link">Vse novice →</a>
        </div>
        
        <div class="grid-3" id="news-grid">
            <!-- Fetching from API would go here, providing 3 placeholders for now -->
            <div class="card news-card" data-id="1">
                <div style="position: relative;">
                    <img src="https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD" class="news-card-img" alt="News 1">
                    <span class="news-badge">Intervencija</span>
                </div>
                <div class="card-body">
                    <span class="card-date">24. maj 2024</span>
                    <h3 class="card-title">Uspešna vaja v Majšperku</h3>
                    <p>Danes smo v sodelovanju z ostalimi društvi izvedli obsežno vajo gašenja.</p>
                </div>
            </div>
            
            <div class="card news-card" data-id="2">
                <div style="position: relative;">
                    <img src="https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD" class="news-card-img" alt="News 2">
                    <span class="news-badge">Dogodek</span>
                </div>
                <div class="card-body">
                    <span class="card-date">20. maj 2024</span>
                    <h3 class="card-title">Dan odprtih vrat</h3>
                    <p>Vabljeni na dan odprtih vrat našega gasilskega doma, ki bo v soboto.</p>
                </div>
            </div>
            
            <div class="card news-card" data-id="3">
                <div style="position: relative;">
                    <img src="https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD" class="news-card-img" alt="News 3">
                    <span class="news-badge">Izobraževanje</span>
                </div>
                <div class="card-body">
                    <span class="card-date">15. maj 2024</span>
                    <h3 class="card-title">Novi tečajniki za gasilce</h3>
                    <p>Z veseljem sporočamo, da smo dobili tri nove kandidate za operativne gasilce.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- News Modal -->
<div id="news-modal" class="modal-overlay">
    <div class="modal-content">
        <span class="modal-close">&times;</span>
        <div id="modal-body">
            <!-- Loaded via JS -->
        </div>
    </div>
</div>
