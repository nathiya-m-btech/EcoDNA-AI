<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep location selection in the shared LocationProvider so separate console pages use the same selected place.
- Keep comparison scores and satellite imagery in separate full-width sections so neither compresses the other.
- Keep the replaceable demonstration ecosystem model in a browser-safe domain module; save immutable settings, baseline, result, and model version for reproducible scenarios.
- Load the Three.js ecosystem renderer lazily only in authenticated browser views to keep WebGL out of server rendering.
- Store simulations and alert workflow actions in user-owned tables with owner-scoped RLS so monitoring data remains unchanged.
- Render the post-sign-in introduction as a browser-only animated simulation driven by the shared demonstration model, not embedded footage, so its readings and terrain remain synchronized.
