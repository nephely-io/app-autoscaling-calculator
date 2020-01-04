# Application auto-scaling calculator

This piece of software acts as a guide to configuring micro-services auto-scaling: fill your orchestrator configuration and your micro-service load tendency/function, and it will return some key figures for fine-tuning the app auto-scaling. It can also give you some insights on how to configure your orchestrator. It presents itself as a single page app (no server-side component); an on-line version can be found here: [https://nephely-io.github.io/app-autoscaling-calculator/](https://nephely-io.github.io/app-autoscaling-calculator/).

This project is a direct application of a methedology describe in the Medium article [Do The Math: Auto-Scaling Microservices Applications with Orchestrators](https://medium.com/nephely/do-the-math-auto-scaling-microservices-applications-with-orchestrators-d15c78c0b12a). I definitively encourage you reading the article before using this tool as it explains the procedure and gives you some definitions on some input figures (especially the load function).

:warning: This application is working but is still in beta as it has not been intensively tested, thus may contain some bugs.

## Orchestrators

As of today, it is compatible with:

* Kubernetes <=1.11
* Kubernetes >=1.12
* Mesosphere Marathon
