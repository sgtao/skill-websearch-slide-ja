/* export-pdf.js
 * PDF エクスポート: window.print() による印刷ダイアログ起動。
 * エクスポートメニュー（ドロップダウン）のトグル制御もここに含める。
 *
 * 依存:
 *   - print.css       : @media print の定義（1ページ=1スライド）
 *   - view-toggle.js  : currentView / applyView()
 *
 * 統合順の正は SKILL.md（参照ファイルガイド／Step 4）を参照。
 *
 * 設計原則:
 *   1. hero モードから印刷した場合、一時的に list モードへ切り替えて全スライドを可視化する。
 *      print.css 側でも hero モードの opacity/position を上書きしているため二重防御になる。
 *   2. afterprint で .exporting-pdf クラスを除去するが、currentView は元に戻さない。
 *      ユーザーが手動で V キー切替できるため、状態の自動復元による副作用を避ける。
 *   3. メニュートグルは単純な hidden 属性の付け外しのみ。アニメーションは入れない。
 */

/* ==========================================================================
 * 1. PDF エクスポート（メイン関数）
 * ========================================================================== */

/**
 * PDF エクスポートを開始する。
 * ブラウザの印刷ダイアログが起動し、ユーザーが「PDF として保存」を選ぶことで PDF 化できる。
 */
function exportPDF() {
    // 1. body にエクスポート準備クラスを付与
    //    print.css 側で .exporting-pdf .slide { opacity: 1; pointer-events: auto; } を効かせる
    document.body.classList.add("exporting-pdf");

    // 2. hero モードなら list モードへ一時切替（全スライドを DOM 可視化）
    //    print.css 側でも opacity/position を上書きしているが、保険として list 化する
    if (typeof currentView !== "undefined" && currentView === "hero") {
        currentView = "list";
        if (typeof applyView === "function") applyView();
    }

    // 3. レイアウト確定を 2 フレーム待ってから print() を呼ぶ
    //    1 回だけだと aspect-ratio の計算前に印刷ダイアログが開く場合がある
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.print();
        });
    });
}

/* ==========================================================================
 * 2. afterprint イベント: 後始末
 * ========================================================================== */

/**
 * 印刷ダイアログを閉じた後、body のエクスポート準備クラスを除去する。
 * currentView は元に戻さない（ユーザーの手動操作で十分）。
 *
 * 注: Ctrl+P 直接押下ルートでは exportPDF() を経由しないため
 *     .exporting-pdf クラスは付かないが、afterprint は発火する。
 *     classList.remove() は対象が無くてもエラーにならないので問題ない。
 */
window.addEventListener("afterprint", () => {
    document.body.classList.remove("exporting-pdf");
});

/* ==========================================================================
 * 3. エクスポートメニュー（ドロップダウン）のトグル制御
 * ========================================================================== */

/**
 * エクスポートメニューを開閉する。
 * #export-dropdown の hidden 属性をトグルするだけのシンプルな実装。
 */
function toggleExportMenu() {
    const dropdown = document.getElementById("export-dropdown");
    if (dropdown) dropdown.toggleAttribute("hidden");
}

/**
 * エクスポートメニューを強制的に閉じる。
 * メニュー内のボタンをクリックした後の自動クローズに使う。
 */
function closeExportMenu() {
    const dropdown = document.getElementById("export-dropdown");
    if (dropdown) dropdown.setAttribute("hidden", "");
}

/* ==========================================================================
 * 4. 外側クリックでメニューを閉じる
 * ========================================================================== */

/**
 * .export-menu の外側をクリックしたらメニューを閉じる。
 * メニュー自身や内部ボタンへのクリックでは閉じない（onclick で個別にクローズ）。
 */
document.addEventListener("click", (e) => {
    // closest('.export-menu') が null = メニュー外をクリック
    if (!e.target.closest(".export-menu")) {
        closeExportMenu();
    }
});

/* ==========================================================================
 * 5. Escape キーでメニューを閉じる
 * ========================================================================== */

/**
 * メニューが開いている状態で Escape キーが押されたら閉じる。
 * navigation.js の keydown ハンドラとは独立して動作（互いに干渉しない）。
 */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const dropdown = document.getElementById("export-dropdown");
        if (dropdown && !dropdown.hasAttribute("hidden")) {
            closeExportMenu();
            e.preventDefault();
        }
    }
});
