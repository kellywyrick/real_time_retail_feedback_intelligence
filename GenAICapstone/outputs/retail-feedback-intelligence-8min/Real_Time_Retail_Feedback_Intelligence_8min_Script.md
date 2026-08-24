# Real-Time Retail Feedback Intelligence

8-minute presentation script for ChicStyle capstone project  
Target timing: about 7 minutes 35 seconds

## Slide 1 - Title (0:00-0:40)

Good morning. This capstone is about helping ChicStyle turn high-volume customer review text into faster retail decisions. The core idea is simple: customer reviews already contain signals about fit, quality, color accuracy, delivery, and satisfaction. The problem is that those signals arrive as unstructured text, especially during peak seasons. This project uses Generative AI to convert that text into structured fields the business can route and act on. The final recommendation is to pilot CoT V2 as the primary prompt, keep Few-Shot V2 as a validation prompt, and use human review for high-risk customer-facing cases.

## Slide 2 - Key Takeaways (0:40-1:30)

There are three takeaways. First, the review base is mostly positive: 77.1 percent of usable reviews are four or five stars. But the lower-rated and mixed reviews still reveal fixable issues around fit, sizing, fabric quality, and product images. Second, CoT V2 is the best production choice even though it ties Few-Shot V2 at the reported 0.92 score, because it is designed for routing and urgency decisions. CoT simply means the model reasons internally before giving the final structured answer. Third, this should be deployed as triage, not autopilot. The recommendation check reached 80 percent accuracy and caught every not-recommended case in the sample, but high-risk outputs still need human oversight.

## Slide 3 - Problem Definition (1:30-2:20)

The business problem is speed and nuance. ChicStyle receives review spikes during holidays and promotions, and manual review cannot scale cleanly. Basic sentiment analysis is not enough because a customer can say, "The dress is cute, but the fit is off and the color does not match the photo." Calling that review simply positive or negative misses the business action. The better question is: what issue is being described, how urgent is it, and which team should own it? The goal of the project is to convert raw review text into a prioritized action queue for support, merchandising, product, and e-commerce teams.

## Slide 4 - Solution Design (2:20-3:20)

The solution design converts each review into seven fields. Category tells us what the review is about, such as fit, sizing, design, color, or comfort. Feedback Type says whether the issue is about the product, service, both, or neither. Sentiment captures the tone as positive, negative, neutral, or mixed. Urgency marks whether the issue is high, medium, or low priority. Summary gives a concise version of the review. Customer Message drafts a personalized response. Retail Insight turns the review into a recommended business action. Together, these fields make the review usable for routing and decision-making.

## Slide 5 - Key Findings (3:20-4:15)

The exploratory findings show that ChicStyle's catalog is broadly well received. After cleaning, there are 22,641 usable review texts. The average rating is 4.18, and more than half of the usable reviews are five-star reviews. That is the good news. The business opportunity is that satisfaction does not eliminate friction. The lower-rated reviews and mixed reviews point to specific expectation gaps. Bottoms have the highest average department rating at 4.28, while Trend is lowest at 3.84, though Trend has a smaller sample size. The takeaway is to focus not just on whether customers like the brand, but on where complaints repeat.

## Slide 6 - Model Findings (4:15-5:15)

For the model comparison, all six prompt versions parsed successfully, so formatting was not the issue. The difference was usefulness. CoT V2 and Few-Shot V2 tied at 0.92 on the LLM-as-Judge score. Zero-Shot V1 followed closely at 0.91, while the others scored 0.90. I selected CoT V2 as the primary production prompt because the final task requires more than sentiment. It requires feedback type, category, urgency, summary, customer response, and retail insight. The recommendation-intent workflow reached 80 percent accuracy. It caught all 12 actual not-recommended cases, but it was conservative and missed 10 reviews that customers did recommend.

## Slide 7 - Customer Insights (5:15-6:05)

The recurring customer themes are actionable. Fit and sizing are the most important operational levers, with customers talking about sleeves, bust, waist, drape, and true-to-size expectations. Fabric and quality issues also show up through comments about material, transparency, durability, and construction. Image and color accuracy matter because product photos shape expectations before purchase. Finally, positive reviews consistently reward flattering design, comfort, softness, and versatility. This means the review pipeline can support both risk reduction and stronger merchandising copy.

## Slide 8 - Recommendations (6:05-7:05)

The recommendations are split into short-term and longer-term actions. In the next three to six months, ChicStyle should revise sizing and fit guidance, improve image and color accuracy, and launch a feedback routing loop so high-urgency and mixed reviews reach the right owners. Over six to twelve months, ChicStyle should standardize sizing logic across collections, evaluate fit predictor tooling, and strengthen product quality feedback loops around fabric, durability, and construction. I am not assigning a dollar ROI because the notebook does not include return costs, support costs, order volume, or API cost assumptions. The value case is faster detection, clearer ownership, and fewer avoidable expectation gaps.

## Slide 9 - Next Steps (7:05-7:35)

My recommended decision is to pilot CoT V2 with human guardrails. The pilot should use a larger fixed sample and a small human-reviewed benchmark. The team should monitor parse success, category drift, high-urgency volume, and cases where CoT V2 and Few-Shot V2 disagree. Once the results are stable, the routing can connect into support and merchandising workflows. The bottom line is that GenAI should prioritize decisions, not remove judgment from high-risk or customer-facing work. That is how ChicStyle can turn review text into a practical operating system for customer feedback.
